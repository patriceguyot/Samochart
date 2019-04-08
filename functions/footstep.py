#!/usr/bin/env python
# -*- coding: utf-8 -*- 
"""
Detection de pas par tempogramme d'impacts
v0.9 au 29 Septembre 2014
Projet CIESS

Maxime Le Coz
"""

from sys import argv
from scipy.io.wavfile import read as wavread
from numpy.fft import rfft
from numpy import max, linspace, mean, array
from numpy import logical_and, arange, exp, pi


def cut(serie, seuil=0):
    """
    Découpe une serie en segment en fonction de leur valeur par rapport
    au seuil
    """
    inseg = False
    start = 0
    segs = []
    for idx, value in enumerate(serie):

        if value > seuil and not inseg:
            inseg = True
            start = idx

        if value <= seuil and inseg:
            inseg = False
            segs.append((start, idx, 'Pas'))

    return segs


def getTempoSpectrum(pos, weights, freq_range):
    """
    Retourne un spectre de rythme d'une serie de temps et de poids.

    pos : array d'instants en secondes
    w : array de poids correspondant aux instants
    freqRange : liste des fréquences pour lesquelles calculer le spectre
    """
    
    j = complex(0, 1)
    return [abs(sum(exp(-2.0 * j * pi * freq * pos)*weights)) for freq in freq_range]


#def computeTempogram(boundaries,wLen=5.0,wStep=0.5,lF=0.3,hF=4.0,N=512) : 	
def computeTempogram(boundarie_list, lower_frequency, higher_frequency, n=512, w_len=5.0, w_step=0.5) :
    """
    Calcul de tempogramme
    boundarie_list : liste des frontières
    lower_frequency	: basse fréquence de l'analyse
    higher_frequency : haute fréquence de l'analyse
    n : Nombre de points
    wLen : Taille de la fenetre d'analyse
    wStep : Pas de l'analyse
    """
    tempogramme = []
    timeScale = []
    freqRange = []
    if len(boundarie_list) > 1:
        times = array([b[0] for b in boundarie_list])
        weights = array([b[1] for b in boundarie_list])

        # Définition du domaine fréquentiel d'analyse
        freqRange = linspace(lower_frequency, higher_frequency, n)

        #  Définition du domaine temporel
        demi = w_len/2
        timeScale = arange(demi,times[-1]-demi, w_step)

        # Récupération des frontières entrant dans chaque trame d'analyse
        frames = [(times[logical_and(times >= (t-demi), times <= (t+demi))], weights[logical_and(times>= (t-demi), times<= (t+demi))])for t in timeScale]

        # Calcul du tempo-spectre par trame, creation du tempogramme
        tempogramme = array([getTempoSpectrum(times, weights, freqRange) for times,weights in frames ])


    else :
        print 'Pas de frontières...'

    return tempogramme,timeScale,freqRange


def getBandAnalysis(boundaries, seuilEnergy, th_decision,lF,hF) :
    """
    boundaries : liste de couples (position, poids) pour les frontières 
    seuilenergy : seuil pour la binarisation
    th_decision : seuil pour la normalisation de la courbe de détection
    lF : fréquence basse pour l'analyse
    hF : fréquence haute pour l'analyse
    """
    
    tempogram,timeScale,freqRange = computeTempogram(boundaries,lF,hF)
    seuil = seuilEnergy*max(tempogram)
    tempogramMask = tempogram > seuil
    tempogram *= tempogramMask
    score = [sum(frame) for frame in tempogram]
    score = [value / th_decision if value < th_decision else 1 for value in score]
    return score, timeScale


#if __name__ == '__main__':
 #   """
  #  Utilisation :
   # python pas.py fichier1 fichier2 ...
    #"""
    
def compute_footstep(audiofilename, annotationfilename):
 
    wLen = 0.005  # Longueur de la fenetre d'analyse du tempogramme
    wStep = 0.005  # Pas de l'analyse pour le tempogramme
    N = 512 	# Nombre de points pour la fft (entre 0 et fe/2)
    fL = 300.0  # Frequence minimale conservé pour l'analyse
    fH = 4000.0  # Frequence maximale conservé pour l'analyse
    th_enrg = 0.60  # Seuil pour la binarisation du tempogramme en ratio du max
    th_decision = 250  # seuil pour la normalisation de la courbe de detection de pas entre 0 et 1

    w = 45  # Longueur du demi voisinage
    thbound = 3  # Seuil pour la détection d'impact (en multiple par rapport à l'energie moyenne du voisinage)
    fe, data = wavread(audiofilename)
    ny = fe/2
    freqRange = linspace(0, ny, N)
    iL = fL/ny*N
    iH = fH/ny*N
    demi = int(wLen/2*fe)
    timeScale = range(demi, len(data)-demi, int(wStep*fe))
    frames = [data[t-demi:t+demi] for t in timeScale]
    spectro = [abs(rfft(f, 2*N)[iL:iH]) for f in frames]
    energy = array([mean(f-fb)+mean(f-fa) for fb, f, fa in zip(spectro[0:-2], spectro[1:-1], spectro[2:])]) # Patrice 25/02 vecteur des pics d'energie du spectrogram
    m = [mean(abs(energy[max([i-w, 0]):min([i+w, len(energy)])])) for i in range(len(energy))] # Patrice 25/02  mean of energy on windows
    boundaries = [(timeScale[i+1]/float(fe), 1) for i, e in enumerate(energy[1:-1]) if e > thbound*m[i]] #  Patrice 25/02 Impacts of energy
    score_list, timeScale = getBandAnalysis(boundaries, th_enrg, th_decision, 0.2, 10)
    with open(annotationfilename, 'w') as f:
		for t, s in zip(timeScale, score_list):
			f.write('%f\t%f\n' % (t, s))
