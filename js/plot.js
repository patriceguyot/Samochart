



// ---------   Basic SVG plots  -----------------------------------------

var NS="http://www.w3.org/2000/svg";


plotrect=function(svg,x,y,w,h,color){
// Plot a rectangle. Origine:x,y. Width: w. Heigh: h. Color:color. Border color: black
 	var SVGObj= document.createElementNS(NS,"rect");
 	SVGObj.width.baseVal.value=w;
 	SVGObj.height.baseVal.value=h;
 	SVGObj.x.baseVal.value=x;
 	SVGObj.y.baseVal.value=y;
 	SVGObj.style.fill=color;
    //SVGObj.style.stroke-width=2;
    SVGObj.style.stroke='black';
    svg.appendChild(SVGObj);
 	return SVGObj;
	}


plotrectclickable=function(svg,x,y,w,h,color,audioname){
// Plot a rectangle. Origine:x,y. Width: w. Heigh: h. Color:color. Border color: black. Add onclik event to play
 	var SVGObj= document.createElementNS(NS,"rect");
 	SVGObj.width.baseVal.value=w;
 	SVGObj.height.baseVal.value=h;
 	SVGObj.x.baseVal.value=x;
 	SVGObj.y.baseVal.value=y;
 	SVGObj.style.fill=color;
    SVGObj.style.fillOpacity=0.1;
    SVGObj.style.stroke='black';
    svg.appendChild(SVGObj);
    SVGObj.onclick = function () {
    
    	if (audio.src==audioname){ // audioname is the same
    	audio.currentTime = 0;
    	audio.pause();
    	SVGObj.style.stroke='black';
    	SVGObj.style.strokeWidth=1;
    	
    	}
    	else { // Play new audio file
    		audio.src=audioname
    		audio.load();
			audio.play();
			SVGObj.style.stroke='#F07C7C'; // color of the border of the TM-chart which is playing
			SVGObj.style.strokeWidth=5;
			audio.onended = function() {
    			console.log("stop playing")
    			SVGObj.style.stroke='black';
    			SVGObj.style.strokeWidth=1;
			};
			
			//audio.onpause = function() {
				//console.log("pause")
			//};
			
			audio.watch("src", function(prop,oldval,newval){
    		//	console.log(playing.value)
    		SVGObj.style.stroke='black';
    		SVGObj.style.strokeWidth=1;
    			return newval;
			});
			
		}
			
		};
 	return SVGObj;
	}




plotline=function(svg,x1,y1,x2,y2,color){
// Plot a line. From (x1,y1) to (x2,y2). Color:color.
 	var SVGObj= document.createElementNS(NS,"line");
 	SVGObj.setAttribute('x1', x1);
 	SVGObj.setAttribute('x2', x2);
 	SVGObj.setAttribute('y1', y1);
    SVGObj.setAttribute('y2', y2);
 	SVGObj.style.fill=color;
    SVGObj.style.stroke=color;
    svg.appendChild(SVGObj);
 	return SVGObj;
}



function plottext(svg,x,y,scale,text){   
// Plot a text. From origin (x,y). Size = fontscale * scale. 
    var fontscale=8;
    var fontsize=scale*fontscale;
    var newText = document.createElementNS(NS,"text");
    newText.setAttributeNS(null,'x',x);     
    newText.setAttributeNS(null,'y',y); 
    newText.setAttributeNS(null,"font-size",fontsize);
    var textNode = document.createTextNode(text);
    newText.appendChild(textNode);
    svg.appendChild(newText);  
    
}



// ---------   TM plots  -----------------------------------------


function scaling(recording,scale){
	var duration=recording.duration;
	//console.log("duration", duration)
	if (duration <1){
		return scale;}
	else if (duration<10){
		return scale*2;}
	else{
		return  2*scale*Math.log10(duration); }

}

function plotTM(svg,recording,x,y,scale){
	var newscale=scaling(recording,scale);
	scale=newscale;
	//console.log(scale)
    x_origin=x;
    for (var i=0; i<recording.sources.length; i++)
    {   
        if (recording.sources[i].percentOfDuration>0){
            plotSource(svg,recording.sources[i],x,y,scale);
            x += scale * recording.sources[i].percentOfDuration;
        }
    }
    var r=plotrectclickable(svg,x_origin, y,Math.floor(scale*100),Math.floor(scale*100),'white',recording.audioFile); // Plot white rectangle with black border
   
    
    
}   
  



function plotSource(svg,source,x,y,scale){ // J'EN SUIS LA !!!!
// Plot a feature from top to bottom
    var shift=0;
    var heights=source.heights.reverse();
    var steps=source.filter.steps.reverse();    
    
    for (var i=0; i<heights.length;i++){	
        
        var origin_x=x;
        var origin_y=y+shift;
        var width=scale*source.percentOfDuration;
        var height=scale*heights[i];
        var color=colorshadec(steps[i],source.filter.color);
        
        var r=plotrect(svg,origin_x, origin_y,width,height,color)
        shift += scale*heights[i];
    }
    source.heights.reverse();
    source.filter.steps.reverse();   
}





// -------------Plot several TM -----------------------------------------------


rowtoplot =function(corpus,scale,x_max){
// function to organize the number of TM by lines to plot (according to the duration and the size of each TM).
// the function gives also a height for each row 

	var current_row=[];
	var row=[]; // row=[[height,[TM1,TM2..TMn]],[height,[TMn+1,..TMm]],...]
	
	var current_x=0;
	var next_x=0;
	var row_max=0;

	var size=0;
	var nextsize=0;
	
	
	for (var i=0; i<corpus.recordings.length; i++)
	{
	   current_row.push(corpus.recordings[i])
	   //console.log('tmarray[i]', tmarray[i])
	   
	   if (i+1< corpus.recordings.length){
	   		
		   size=scaling(corpus.recordings[i],scale)*130;
		   row_max=Math.max(row_max,size);
		   current_x+=size;
		   
		   nextsize=scaling(corpus.recordings[i+1],scale)*130;
		   next_x=current_x+nextsize;
		   
		   if (next_x>x_max) // The Next TM is behind the limit 
		   {
				row.push([row_max,current_row]);
				//console.log('row', row)
				row_max=0;
				current_x=0;
				current_row=[];
		   }
	   }
	   
	   else{
	   size=scaling(corpus.recordings[i],scale)*130;
	   row_max=Math.max(row_max,size);
	   row.push([row_max,current_row]);
	   
	   } 	   
	}
	return row;
}




plotTMarray = function(svg,	x_origin,y_origin,corpus,scale,x_max){
// Plot several TM. Plot in lines and column depending of x_max 
  
   var y_shift= scale*130; // 1.5 * the size of the TM-chart
   var x_shift= scale*130; // 1.5 * the size of the TM-chart
   var legendbarsize=15*scale; // width of the legend bar
   
   //var x_max_plot=x_max-x_shift-120*scale;
   
   var x=x_origin+1.5*legendbarsize;
   var y=y_origin+legendbarsize;
   var k=0;
   
   var rtp=rowtoplot(corpus,scale,x_max)
   console.log('rtp', rtp)
   var recording;
   
   for (var i=0; i<rtp.length; i++){
   		// plot row
   		for (var j=0; j<(rtp[i][1]).length; j++){
   			
   			recording=rtp[i][1][j];
   			plotTM(svg,recording,x,y,scale);
   			plotTicks(svg,recording,x,y,scale);
	  	 	
	  	 	//plotTMname(svg,filenames[k],x,y,scale);
	  	 	//plotTMname(svg,(recording.recordingName + ' - ' + recording.duration),x,y,scale*3); // changed to vue duration
	  	 	plotTMname(svg,(recording.recordingName),x,y,scale*5); // changed to vue duration
	  	 	
	   		plotlegendbarVerc2(svg,recording,x,y,scale,legendbarsize)
	   		x+= 130*scaling(recording,scale);
	   		k++;
   		}
   		x =  x_origin+1.5*legendbarsize;
		y += rtp[i][0]+legendbarsize;
   
   
   }
   
}




// ---------------- TM Legend plots ----------------------------------------




function plotTMname(svg,name,x,y,scale) {
// Plot name of a TM above the rectangle.
	shiftx=scale * 15;
	shifty=scale * 15;
	shifty=-scale * 5;
	
	plottext(svg,x+shiftx,y+shifty,scale,name);
}


function plotTicks(svg,recording,x,y,scale) {
// Plot ticks of a TM.
   
    shift=scale * 15;
    medium_shift=scale * 8;
    small_shift=scale * 5;
    tmsize=scaling(recording,scale)*100;
    
    plottext(svg,x-shift,y+small_shift,scale,'100');
    plottext(svg,x-small_shift,y+tmsize + small_shift,scale,"  0");
    plottext(svg,x+tmsize-small_shift,y+tmsize+medium_shift,scale,'100');
  
}



function plotfeaturename(svg,tmfeatarray,x,y,scale) {
// Plot feature name above a feature in a TM
    small_shift=scale * 5;
    x=x+small_shift/2; // en attendant mieux !
    y=y-small_shift;
    
        for (var i=0; i<tmfeatarray.length; i++)
    {   
        if (tmfeatarray[i].width > 0)// plot only if visible
        {
                
        plottext(svg,x,y,scale,tmfeatarray[i].name);
        }
        x += scale * tmfeatarray[i].width;
        
    }
}    



function plotlegendbar3plot(svg,corpus,x,y,scale){
   var origin_x=x;
   var origin_y=y;
   var textvalue;
   size=scale*8;
   small_shift=scale * 4;
   for (var i=0; i<corpus.filters.length; i++)
   {
	   plottext(svg,origin_x,origin_y-0.5  * small_shift,scale,corpus.filters[i].filterName);
	   for (var j=0; j<corpus.filters[i].steps.length; j++)
	   {
		  
		   plotrect(svg,origin_x, origin_y,size,size,colorshadec(corpus.filters[i].steps[j],corpus.filters[i].color));
		   
		   textvalue=Math.round(corpus.filters[i].steps[j]*100); //old plot for confidence values
		  
		   
		   plottext(svg,origin_x+5,origin_y+ 3 * small_shift,scale/2,textvalue);
		   origin_x +=size;
	   }
	   origin_x += 6 * size;
	   origin_y=y;
   }       
}



function plotlegendbarVerc(svg,tmfeatarray,x,y,scale){
// Plot several vertical lengend bars.  Bars are aligned horizontally 
        var origin_x=x;
        var origin_y=y;
        size=scale*8;
        small_shift=scale * 4;
        for (var i=0; i<tmfeatarray.length; i++)
        {
            for (var j=0; j<tmfeatarray[i].confidence.length; j++)
            {
                plotrect(svg,origin_x, origin_y,size,size,colorshadec(tmfeatarray[i].confidence[j],tmfeatarray[i].color));
                plottext(svg,origin_x+ 2.5 * small_shift,origin_y+small_shift,scale/2,tmfeatarray[i].confidence[j]);
                origin_y +=size;
            }
            origin_x += 2 * size;
            origin_y=y;
        }       
}

function plotlegendbarVerc2(svg,tmfeatarray,x,y,scale,legendbarsize){
// Plot several vertical lengend bars. Bars are aligned vertically  
		var shiftx=legendbarsize;
		var shifty=legendbarsize;   
        var origin_x=x-shiftx;
        var origin_y=y+shifty;
        size=scale*8;
        small_shift=scale * 4;
        for (var i=0; i<tmfeatarray.length; i++)
        {
            for (var j=0; j<tmfeatarray[i].confidence.length; j++)
            {
                plotrect(svg,origin_x, origin_y,size,size,colorshadec(tmfeatarray[i].confidence[j],tmfeatarray[i].color));
                plottext(svg,origin_x+ 2.5 * small_shift,origin_y+small_shift,scale/2,tmfeatarray[i].confidence[j]);
                origin_y +=size;
            }
            origin_x=x-shiftx ;
            origin_y+=scale*2;
        }       
}


function plotlegendbarHor(svg,tmfeatarray,x,y,scale){
    
    var confidence=extractConfidencesTm(tmfeatarray);           
    var origin_x=x;
    var origin_y=y;
    size=scale*8;
    small_shift=scale * 2;
    for (var i=0; i<confidence.length; i++){
        
        
        plotrect(svg,origin_x, origin_y,size,size,colorshade(confidence[i]));
        plottext(svg,origin_x+small_shift,origin_y-small_shift,scale/2,confidence[i]);
        origin_x +=size;
    }
} 



//------------Color -----------------------------------

function colorshadec(n, color) // return HSL color with luminance value depending on parameter n
{
    var a = Math.round(n*100);
    var level=100-a;
    return 'hsl(' + color + ',100%,' + level + '%)';
}






