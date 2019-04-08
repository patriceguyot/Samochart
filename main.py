#!/usr/bin/env python
# -*- coding: utf-8 -*- 
__author__ = 'guyot'
"""
Launching detection algorithms 

Creation: v0.1. 30 october 2014
Last modification: v0.2. 18 novembre 2014 

Projet CIESS
Patrice Guyot


Usage: python main.py -MFH
"""


import sys
import glob
from os.path import basename, splitext
import argparse
from functions.motor import compute_motor
from functions.footstep import compute_footstep
from functions.carhorn import compute_horn

def common_elements(list1, list2):
    return [element for element in list1 if element in list2]   

def different_elements(list1,list2):
	return [element for element in list1 if element not in list2]	

def print_list(list):
    return ', '.join(map(str, list)) + '.'
		




if __name__ == '__main__':


    #algo_list=['motor','footstep','horn']
    default_audio_path = 'audio/'  # Audio directory
    default_annot_path = 'annotation/'  # Annotation directory

    # Extensions of the files
    audio_ext = '.wav'
    annot_ext = '.txt'


    #---------------------- main program ------------------------------------


    # -------------- manage arguments -------------

    parser = argparse.ArgumentParser(description='Launch the detection algorithm(s) on audio file(s).', formatter_class=argparse.ArgumentDefaultsHelpFormatter)



    parser.add_argument( "-M", "--motor", help="Launch the motor detection algorithm", action="store_true")
    parser.add_argument("-F", "--footstep", help="Launch the footstep detection algorithm", action="store_true")
    parser.add_argument("-H", "--horn", help="Launch the horn detection algorithm", action="store_true")

    parser.add_argument("-f", "--audiofile", help="Audio file", metavar='')
    parser.add_argument("-d", "--audiodir", help="Audio directory", default=default_audio_path, metavar='')
    parser.add_argument("-a", "--annotdir", help="Annotation directory", default=default_annot_path, metavar='')

    #args = vars(parser.parse_args())
    args = parser.parse_args()


    algo_list=[]
    if args.motor: algo_list.append('motor')
    if args.footstep: algo_list.append('footstep')
    if args.horn: algo_list.append('horn')

    if len(algo_list)==0:
        print "No detection function choose. Please use --help for help."
        sys.exit(0)
    else:
        print '\nLaunching the following algorithm(s):', print_list(algo_list)


    file_list=[]
    if args.audiofile: file_list.append(args.audiofile)
    else:
        for audio_filename in glob.glob(args.audiodir + '*' + audio_ext):
            file_list.append(audio_filename)

    # -------------- processing

    for k,audio_filename in enumerate(file_list):
        print  ('\nProcessing file %d of %d: %s' % (k+1,len(file_list),audio_filename))
        for i,algo in enumerate(algo_list):
            print 'Lanching: ', algo
            annot_filename = args.annotdir + splitext(basename(audio_filename))[0] + '--' + algo + annot_ext
            algo_str = 'compute_' + algo
            locals()[algo_str](audio_filename, annot_filename)


