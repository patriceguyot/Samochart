
// ------------ Maths --------------------------------------------

  
percent = function (values,thres){
// Return the % of the length of an sorted array which is superior to a specified value thres 
  		var i=0;
  		while (values[i]>=thres) {i++;}
  		//return Math.floor(100*i/values.length);
  		
  		//return Math.ceil(100*i/values.length);
  		return (100*i/values.length);
}


// ---------  Read file --------------------------------------------------------


function getdatafromfile(filename)  {
// Read annotation file. Example : %timeinstant \t %value \n
// Return an array of string
   var arraydata
   $.ajax({
		  type: "GET",
		  url: filename,
		  dataType: "text",
		  async: false,
		  success: function(csv) {arraydata = $.csv.toArrays(csv,{separator:'\t'}); }
		  });
   
   
   return arraydata
}

   

function getcolumn(array,numcolumn){
// Otput a specific float column from an array of string   
   out=[];
   for (var i=0; i<array.length; i++) {
	   out.push(parseFloat(array[i][numcolumn]));
   }
   return out;
}

   
  

//  ---------- Compute TM ------------------------------------------------


function makeTMfeat(feature){
// From a feature, compute the relative width, filters, heights and confidence
// The width and heights are those of the rectangles to plot   	  
   feature.width=percent(feature.values,feature.thres);
   feature.filters=makefilters(feature.thres,feature.nfilters); 
   feature.heights=TMmakeHeigths(feature.values,feature.filters, feature.thres);
   feature.confidence=makeconfidence(feature.filters);
   return feature;     
}    

       
 
 function  tracefeature(feature){   
 // Output values of a feature in a TM context
 	   console.log("--------   Filename : " + feature.filename +  "  ----------");	
 	   console.log("--------   audioname : " + feature.audioname );	
 	   console.log("--------   duration : " + feature.duration );	
	   console.log("---   " + feature.name +  "  ---");
	   console.log("values : ", feature.values)
	   console.log("Threshold : ", feature.thres)   
	   console.log("Filters : ", feature.filters)
	   console.log("Confidence : ", feature.confidence)
				  
	   console.log("Heights : ", feature.heights)
	   console.log("Width : ", feature.width)      
}
   
   

TMmakeHeigths= function (values,filters,threshold){
// Compute and return an array of heights of a feature (in a TM)     
    if (values[0]<threshold) {return [0];}
    else
           
    var heights=[];  var i=0,ind=0;    
    // Take only the values > to the threshold
    var n=0;
    while (values[n]>=threshold) {n++;}
    
 
        
        values=values.slice(0,n);
        
        // compute the heights
        var rest=0.0;
        for (var ifi = 0; ifi < filters.length; ifi++) {
            while (values[i]>=filters[ifi]) {i++;}
            heights.push( Math.round(100*(i-ind)/values.length  + rest) );
            rest= 100*(i-ind)/values.length + rest - Math.round(100*(i-ind)/values.length + rest); 
            ind=i;}
        return heights;
}



totalwidth = function (tmfeatarray){
// Compute and return width of a feature in a TM 
    var width=0;
    for (var i=0; i<tmfeatarray.length; i++)
    {
        width += tmfeatarray[i].width /100;
    }
    return Math.max(1,width);
}






// ---------   Confidence values  -----------------------------------------



var makefilters = function(thres,n){
// Return an array of n values of filters of equal size, computed from a threshold to 1 
    filters=[];
    size=(1-thres)/n;
    for (var i = 0; i < n; i++) {
        filters.push(thres + i * size);
    }
    
    filters.reverse();
    return filters;
}  



var makeconfidence = function(filters){
// Compute and return the confidence (in %) from a filter value (between 0 and 1)
    var confidence= new Array(filters.length);
    
    for(var i=0; i<confidence.length; i++) {
        confidence[i]= Math.round(filters[i]*100);
    }
    return confidence;
}


function extractConfidencesTm(tmfeatarray){
    var confidence=[];
    for (var i=0; i<tmfeatarray.length; i++) {
        confidence.push.apply(confidence, tmfeatarray[i].confidence);         
        }
    confidence=eliminateDuplicates(confidence);
    confidence.sort();
    return confidence;
}



// --------------------------random ---------------------------


var shuffle = function(o){ 
// shuffle an array
		for(var j, x, i = o.length; i; j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
		return o;
};

var generate_table = function(length){
// Compute and return array of random values between 0 and 1
// Compute (number nbvalues) values from 0 to 1. Shuffle them, and take the first (number length) values.
	var nbvalues =  length * 10;
	var i, max_length, arr = [];
	max_length=length * nbvalues;
	for (i = 1; i<max_length; i++) 		{		arr.push(i/max_length);		}
	arr=shuffle(arr);
	arr=arr.slice(1,length);
	return arr;
};




makerandomTMarray = function(){
// Make random TMs. Return TM array
	   
   nb_tm=12;   
   tmarray=[];
   nbfeature=2;
   nbvalues=5;
   
   colorfeatures=[230, 130];
   
   for (var i=0; i<nb_tm; i++)
   { 
	   var featarray=[];
	   for (var j=0; j<nbfeature; j++)
	   {
		   var arr= [];
		   arr=generate_table(nbvalues);
		   arr.sort();
		   arr.reverse();
	   
		   var name= "feature" + j;
		   var feature= {name: name, values: arr, thres: 0.6, filters:[], confidence:[], nfilters: 3, width:0, heights:[], color : colorfeatures[j]};
		   feature=makeTMfeat(feature);
		   featarray.push(feature);
	   }
	   tmarray.push(featarray);    
   }
   return tmarray;
}










