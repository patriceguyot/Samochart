#!/usr/bin/env python
# -*- coding: utf-8 -*- 
__author__ = 'lecoz'
"""
Detection de moteurs par energie basse fréquence. 
v0.5 au 29 Septembre 2014
Projet CIESS

Maxime Le Coz 
"""
from scipy.io.wavfile import read as wavread
from sys import argv
from numpy import linspace,mean
from numpy.fft import rfft


def get_spectro(frame_list, n_fft, i_min, i_max):
    """
    :param frame_list: list of the frames
    :param n_fft: number of frames for the fft
    :param i_min: index min of the spectro to keep
    :param i_max: index max of the spectro  to keep
    :return: spectrogramme
    """

    return [abs(rfft(frame, n_fft*2))[i_min:i_max]**2 for frame in frame_list]


def get_minima(values):
    """
    retourne la liste des minima locaux 
    """
    p = [(p+1, v) for p, v in enumerate(values[1:-1]) if values[p] > v < values[p+2]]
    return p


def centroid_spectral(freqs, x):
    """
    Calcul de centroid spectral
    freqs : liste des fréquences
    x : liste des amplitudes
    """
    up = [vf * vx for vf, vx in zip(freqs, x)]
    return sum(up)/sum(x)


def moment(proba, freqs, order):
    """
    Fonction de calcul d'un moment
    proba : liste des probabilités de chaque element (amplitude)
    freq : frequences de chaque élément
    order : ordre du moment
    """

    u = centroid_spectral(freqs, proba)
    return sum([(freq-u)**order*p for freq,  p in zip(freqs, proba)])

#if __name__ == '__main__':
def compute_motor(audiofilename, annotationfilename):

    wLen = 2048  # Taille de la fenetre d'analyse
    wStep = 1024  # Pas pour l'analyse
    w_mean = 50  # demi voisinage pour le lissage médian
    imin = 0  # indice min de la fft pour l'analyse
    imax = 20  # indice max de la fft  pour l'analyse

    #for filePath in argv[1:]:
    print 'reading...'
    fe, data = wavread(audiofilename)
    data = list(data)
    fe = float(fe)
    w = int(wLen/2)
    times = range(w, len(data)-w, wStep)
    frames = [data[i-w:i+w] for i in times]
    times = [float(t)/fe for t in times]
    ny = fe/2
    freqline = linspace(0, ny, wLen)
    print 'computing spectrogram...'
    spectrum = get_spectro(frames, wLen, imin, imax)
    print 'computing motor values...'
    spread = [moment(s, freqline[imin:imax], 2) for s in spectrum]
    norm = float(mean(spread))
    motor = [0]*w_mean+[float(min(spread[i-w_mean:i+w_mean]))/norm for i in range(w_mean, len(spread)-w_mean)]+[0]*w_mean
    motor = [m if m < 1 else 1 for m in motor]
    print 'writing...'
    with open(annotationfilename, "w") as f:
    	for t,v in zip(times, motor):
			f.write("%f\t%f\n" % (t,v))