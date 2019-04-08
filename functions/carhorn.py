#!/usr/bin/env python
# -*- coding: utf-8 -*- 
__author__ = 'guyot'
"""
Détection d'avertisseur sonore.
v0.1 du 6 novembre 2014
Projet CIESS

Patrice Guyot 
"""

# Warning of the power 2 at the spectrogram






import numpy as np
from sys import argv
from scipy.signal import lfilter, butter
from scikits.audiolab import wavread, wavwrite
from numpy.fft import fft
from math import ceil, floor
from os import path, remove
#from matplotlib import pylab





def smooth(list_freqt_res,smoothing_e):
    new_list_freqt_res=[]
    for i in range(len(list_freqt_res)):
        diff_vec=np.diff((list_freqt_res[i]>0).astype(int))
        begin_vec=(diff_vec==1).nonzero()[0]+1
        end_vec=(diff_vec==-1).nonzero()[0]+1
        change=True
        k=0
        while change and k < len(begin_vec)-1:
            k+=1
            change=False
            if len(begin_vec) > 1:
                if begin_vec[k]-end_vec[k-1]<smoothing_e:
                    begin_vec=np.concatenate((begin_vec[0:k],begin_vec[k+1:]))
                    if k > 1:
                        end_vec=np.concatenate((end_vec[0:k-1],end_vec[k:]))
                    elif k == 1:
                        end_vec=end_vec[1:]
                    k=0
                    change=True
        new_res=np.zeros(len(list_freqt_res[i]))
        for k in range(len(begin_vec)):
            new_res[begin_vec[k]:end_vec[k]]=np.mean(list_freqt_res[i][begin_vec[k]:end_vec[k]])
        new_list_freqt_res.append(new_res)
    return new_list_freqt_res





def identification(list_freqt_res,frequencies):
    """
    res= 0 -> false alarm, 1 -> bus, 2 -> bell, 3 -> car horn
    """
    res = []
    freq_bus_min_hz = 1250
    freq_bus_max_hz = 1380
    freq_bus_min_e = np.argmin([abs(e - freq_bus_min_hz) for e in frequencies])
    freq_bus_max_e = np.argmin([abs(e - freq_bus_max_hz) for e in frequencies])

    freq_bell_min_hz = 3000
    freq_bell_max_hz = 4800
    freq_bell_min_e=np.argmin([abs(e - freq_bell_min_hz) for e in frequencies])
    freq_bell_max_e=np.argmin([abs(e - freq_bell_max_hz) for e in frequencies])

    freq_closepeak_hz = 500
    freq_closepeak_e=np.argmin([abs(e - freq_closepeak_hz) for e in frequencies])

    for i in range(len(list_freqt_res)):
        smooth_spectrum=list_freqt_res[i]
        diff_smooth_spectrum=(np.diff((smooth_spectrum>0).astype(int))==1).nonzero()[0]
        number_peak=len(diff_smooth_spectrum)
        if number_peak>1:
            closepeak=min(np.diff(diff_smooth_spectrum))
        else:
            closepeak=len(frequencies)
        # Bus
        if number_peak<=5 and closepeak>freq_closepeak_e and max(smooth_spectrum[freq_bus_min_e:freq_bus_max_e])>0:
            res.append(1)
        #Bell
        elif number_peak==1 and max(smooth_spectrum[freq_bell_min_e:freq_bell_max_e])>0:
            res.append(2)
        #Car horn
        elif number_peak>5:
            res.append(3)
        else:
            res.append(0)
    return res






def selection(spectro,size_win_desc_b,hop_win_desc_b,frequencies,indices):

    bands_freq_Hz = 150 # Frequency bands of the neighborhood
    thresh_neigbourhood = 4 # First threshold between the row and the neighborhood
    thresh_neigbourhood2 = 3 # Second threshold between the row and the neighborhood
    thresh_energy = 300 # Energy threshold of the maximum

    bands_freq_b = np.argmin([abs(e - bands_freq_Hz) for e in frequencies])+1 # Frequency bands of the neighborhood in bin

    indices_littlespectro = range(0, len(indices) - size_win_desc_b, hop_win_desc_b)
    nbsegments = len(indices_littlespectro)

    image_result=np.zeros((len(frequencies),len(indices))) # Creation of an empty image result


    spectro=np.array(spectro).transpose() # spectro list of list goes to numpy array

    for m in range(nbsegments):
        littlespectro = spectro[:,indices_littlespectro[m]:indices_littlespectro[m]+size_win_desc_b]
        meanspectro=np.mean(littlespectro, axis=1)
        max_row = max(meanspectro)
        max_row_pos = np.argmax(meanspectro)

        neighborhood = np.mean(meanspectro[max(0,max_row_pos - bands_freq_b):min(max_row_pos + bands_freq_b,len(frequencies))])


        if max_row/neighborhood>thresh_neigbourhood: # Selection of candidates

            for i in range(len(frequencies)-2*bands_freq_b): # Consideration of each row of the little spectro
                row=meanspectro[i]
                neighborhood = np.mean(meanspectro[max(0,i - bands_freq_b):min(i + bands_freq_b,len(frequencies))])

                if row/neighborhood >thresh_neigbourhood2: # Validation of each good row of the candidate
                    image_result[i,indices_littlespectro[m]:indices_littlespectro[m]+size_win_desc_b]=row
    return image_result






# -------------- MAIN PROGRAM ______________________
def compute_horn(audiofilename, annotationfilename):

    audiofilterpath = 'temp/'
    audiofiltername = audiofilterpath + path.basename(audiofilename)
    [x, fe, nbBits] = wavread(audiofilename)


    #---------- Filtering
    print 'High-Pass Filtering'
    f_nyquist = fe/2
    f_cut=1500
    Wn=f_cut/float(f_nyquist)
    [b,a]=butter(10, Wn, btype='highpass')
    y=lfilter(b,a,x)

    wavwrite(y,audiofiltername,fe,nbBits)


    # Reading filtered signal
    [x, fe, nbBits] = wavread(audiofiltername)
    duration = len(x) / float(fe)

    # Features (spectrogram)
    size_wfft = 2048  # Window size for the fft
    hop_fft = 512   # Hop size for the fft


    indices = range(0, len(x) - size_wfft, hop_fft)  # onset of windows
    frames = [x[i:i + size_wfft] for i in indices]
    window = np.hamming(size_wfft)  # Hamming window

    spectro = [list(abs(fft(frame * window))[0:size_wfft / 2]) for frame in frames] #WARNING : THE SPECTROGRAM IS NOT COMPUTED WITH THE POWER 2

    times = [e * duration / float(len(indices)) for e in range(len(indices))] # vector of time<-bin in the spectrogram
    frequencies = [e * f_nyquist / float(size_wfft / 2) for e in range(size_wfft / 2)] # vector of frequency<-bin in the spectrogram


    # Selection
    size_win_desc_d = 0.4   # descriptor window size duration
    hop_size_selection_d=0.05    #  descriptor hop window size duration
    size_win_desc_b = int(ceil(size_win_desc_d * len(indices) / duration))  # descriptor window size in bin
    hop_win_desc_b = int(ceil(hop_size_selection_d * len(indices) / duration))  # descriptor window size in bin
    image_result=selection(spectro,size_win_desc_b,hop_win_desc_b,frequencies,indices)


    # Extraction
    vec_res=image_result.max(axis=0)>0 # Temporal binar vector
    #diff_res=np.diff(vec_res.astype(int))
    begin=(np.diff(np.hstack((False, vec_res.astype(int)))) == 1).nonzero()[0] # begin of all events in bin
    end=(np.diff(np.hstack((vec_res.astype(int), False))) == -1).nonzero()[0]  # end of all events in bin

    begin_t = begin*duration/len(indices) # begin of all events in time
    end_t = end*duration/len(indices) # begin of all events in time

    event_number = len(begin) # number of selected events

    #matres=[] # List of selected little spectro
    time_res = [] # final vector for printing
    list_freqt_res = []  # List of frequential vector for each selected segment (the value is the maximum of the segment for each frequency

    for i in range(event_number):
        image_one=image_result[:,begin[i]:end[i]]
        #matres.append(image_one)
        time_res.append([begin[i]*duration/len(indices),end[i]*duration/len(indices)])
        list_freqt_res.append(image_one.max(axis=1))


    #Spectral smoothing
    smoothing_Hz=80;
    smoothing_e = np.argmin([abs(e - smoothing_Hz) for e in frequencies])
    list_freqt_res=smooth(list_freqt_res,smoothing_e)

    # Identification as bus, car horn or bell
    res=identification(list_freqt_res,frequencies)


    # Writing
    precision_annot=0.05 # annotation precision in seconds
    time_annot=np.zeros(duration/precision_annot)

    for i in range(event_number):
        time_annot[int(begin_t[i]/precision_annot):int(end_t[i]/precision_annot)]=res[i]/float(3)
    print 'writing...'
    with open(annotationfilename, "w") as f:
        for t in range(len(time_annot)):
            f.write("%f\t%f\n" % (t*precision_annot,time_annot[t]))
    remove(audiofiltername)


    # pylab.imshow(np.log(image_result))
    # pylab.show()


