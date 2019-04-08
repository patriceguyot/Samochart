// Patrice Guyot
// IRIT
// Last modification: 2015/01/16



// Classes definitions
	
	
function Corpus(name){
		
		this.name=name;
		this.recordings = [];
		this.filters =[];
		//this.features= new Array();
	
}



function Filter(name){
	this.corpus = '';
	this.filterName=name;
	this.threshold = false;
	this.numberOfStep = false;
	this.color = false;
	this.steps = [];

}

function Recording(name){
	
		this.recordingName=name;
		this.corpus = '';
		this.duration = false;
		this.sources = [];
		this.audioFile = '';
}

function Source(name){
	
		this.sourceName=name;
		this.filename = '';
		this.recording = '';
		this.percentOfDuration = false;
		this.data = [];
		this.heights = [];
		this.filter = '';	
}

	
	
// Methods	
	
	
Corpus.prototype.addRecording = function(recording){
		recording.corpus = this;
		this.recordings.push(recording);
		console.log("recording "+ recording.recordingName + " added to the corpus");
}

Corpus.prototype.addFilter = function(filter){
		
		filter.corpus = this;
		this.filters.push(filter);
		console.log("filter \""+ filter.filterName + "\" added to the corpus");
}
	
Corpus.prototype.getRecording = function(recordingName){
		var result = $.grep(this.recordings, function(recording){ return recording.recordingName === recordingName; });
		if (result.length === 0){
			return undefined;
			}
		else {
		return result[0];}	
}


Corpus.prototype.getFilter = function(filterName){
		var result = $.grep(this.filters, function(filter){ return filter.filterName === filterName; });
		if (result.length === 0){
			return undefined;
			}
		else {
		return result[0];}	
}
	
	
	
	
Recording.prototype.addSource = function(source){
		source.recording = this;
		this.sources.push(source);
		console.log("source \""+ source.sourceName + "\" added to the recording " + this.recordingName);	
}
	
	
Source.prototype.makeHeigths= function(){
// Compute and return an array of heights for a source and a filter      
    if (this.data[0] < this.filter.threshold)
     {
    this.heights=[0];
    }
    else
           
    var i=0;
    var ind=0;    
    // Take only the data > to the threshold
    var n=0;
    var data=this.data;
    while (data[n]>=this.filter.threshold) {n++;}
    data=data.slice(0,n);    
    
    // compute the heights
    var rest=0.0;
    for (var ifi = 0; ifi < this.filter.steps.length; ifi++) 
    		{
            while (data[i]>=this.filter.steps[ifi]) {i++;}
            this.heights.push( Math.round(100*(i-ind)/data.length  + rest) );
            rest= 100*(i-ind)/data.length + rest - Math.round(100*(i-ind)/data.length + rest); 
            ind=i;
            }
}
	

	

Filter.prototype.makeSteps = function(){ 
// Return an array of n values of filters of equal size, computed from a threshold to 1 
    this.steps=[];
    var size = (1 - this.threshold) / this.numberOfStep;
    for (var i = 0; i < this.numberOfStep; i++) {
        this.steps.push(this.threshold + i * size);
    }
    this.steps.reverse();
} 

	
	