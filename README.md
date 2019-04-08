# Samochart
Automatic analysis and visualization of urban soundscapes

## OVERVIEW

This package contains:
 - python functions that compute descriptors of environmental sound detection in a corpus of sound.
 - HTML and javascript code to visualise a field recording corpus
 
 ## DEPENDENCIES

To run the package, you need to install python 2.7, and the following python modules: numpy, scipy and scikits.

- Installing dependencies on Mac OS X:

install Xcode 
install homebrew -> http://brew.sh/
cmd: brew install gcc libsndfile
cmd: brew install python --framework
cmd: pip install numpy scipy 
install scikit-audioloab from source http://scikits.appspot.com/audiolab


- Installing dependencies on Linux:

sudo apt-get install python-numpy python-scipy
install scikit-audioloab from source http://scikits.appspot.com/audiolab

## INSTRUCTIONS
 
This package contains functions to extract descriptors on the following sound events: motor, footstep, horn.
To run the extraction of all the descriptors, run 'python main.py -MFH'

To visualize the TM-charts of the audio files, launch 'plot_™-CIESS.html', and browse files from the annotation folder.
