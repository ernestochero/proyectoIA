import { Component, ViewChild, Renderer } from '@angular/core';
import { Platform } from 'ionic-angular';


@Component({
  selector: 'canvas-draw',
  templateUrl: 'canvas-draw.html'
})
export class CanvasDrawComponent {


  @ViewChild('myCanvas') canvas: any;
  
     canvasElement: any;
     lastX: number;
     lastY: number;

     currentColour: string = '#1abc9c';
     brushSize: number = 10;
 

  constructor(public platform: Platform, public renderer: Renderer) {

  }
  ngAfterViewInit(){
    
           this.canvasElement = this.canvas.nativeElement;
    
           this.renderer.setElementAttribute(this.canvasElement, 'width', 280 + '');
           this.renderer.setElementAttribute(this.canvasElement, 'height', 280 + '');
    
  }

  handleStart(ev){
    
           this.lastX = ev.touches[0].pageX;
           this.lastY = ev.touches[0].pageY;
  }

  handleMove(ev){
    
           let ctx = this.canvasElement.getContext('2d');
           let currentX = ev.touches[0].pageX;
           let currentY = ev.touches[0].pageY;
    
           ctx.beginPath();
           ctx.lineJoin = "round";
           ctx.moveTo(this.lastX, this.lastY);
           ctx.lineTo(currentX, currentY);
           ctx.closePath();
           ctx.strokeStyle = this.currentColour;
           ctx.lineWidth = this.brushSize;
           ctx.stroke();       
    
           this.lastX = currentX;
           this.lastY = currentY;
    
  }


}
