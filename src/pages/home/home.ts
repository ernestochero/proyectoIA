import { Component, ViewChild, ElementRef, Renderer, EventEmitter } from '@angular/core';
import { NavController, Platform  } from 'ionic-angular';
import { UtilsProvider } from '../../providers/utils/utils';
import { w12, w23 , bias2, bias3 } from './pesos';
@Component({
  selector: 'page-home',
  templateUrl: 'home.html',
  providers:[UtilsProvider]
})
export class HomePage {
  @ViewChild('can') canvasElement: ElementRef;
  public canvas:any; 
  public ctx:CanvasRenderingContext2D;
  public clearBeforeDraw = false;
  public paths = []; // recording paths
  public prevX = 0;
  public currX = 0;
  public prevY = 0;
  public currY = 0;
  public paintFlag = false;
  public color = "black";
  public lineWidth = 20;

  public nnInput;

  // valores para mostrar ... 
  public dataLenght;
  public w12Lenght;
  public bias2Lenght;
  public w23Lenght;
  public bias3Lenght;
  public numero;


  // 
  public lastX: number;
  public lastY: number;
  public currentColour: string = 'black';
  public brushSize: number = 10;

  constructor(
    public navCtrl: NavController, 
    public renderer: Renderer,
    public elementRef: ElementRef,
    public _utils:UtilsProvider,
    public platform: Platform) {

  }

  ngAfterViewInit(){
   this.canvas = this.canvasElement.nativeElement;
   this.renderer.setElementAttribute(this.canvas, 'width', 280 + '');
    this.renderer.setElementAttribute(this.canvas, 'height', 280 + '');
  }

  handleStart(ev){
           this.lastX = ev.touches[0].pageX -40 ;
           this.lastY = ev.touches[0].pageY - 40;
           console.log(this.lastX + ' - '+ this.lastY);
  }

  handleMove(ev){
      console.log('evt')
           let currentX = ev.touches[0].pageX - 40;
           let currentY = ev.touches[0].pageY - 40;
           this.ctx = this.canvas.getContext("2d");
           this.ctx.beginPath();
           this.ctx.lineJoin = "round";
           this.ctx.moveTo(this.lastX, this.lastY);
           this.ctx.lineTo(currentX, currentY);
           this.ctx.closePath();
           this.ctx.strokeStyle = this.currentColour;
           this.ctx.lineWidth = this.brushSize;
           this.ctx.stroke();       
    
           this.lastX = currentX;
           this.lastY = currentY;
    
  }

  ionViewDidLoad() {
    
  }
  public init() {
    this.canvas = this.canvasElement.nativeElement;
    this.ctx = this.canvas.getContext("2d");
    this.renderer.listen(this.canvas, 'mousemove', (e)=>{
      this.findxy('move', e);
    });
      this.renderer.listen(this.canvas, 'mousedown', (e)=>{
      this.findxy('down', e);
    });
    this.renderer.listen(this.canvas, 'mouseup', (e)=>{
      this.findxy('up', e);
    });
    this.renderer.listen(this.canvas, 'mouseout', (e)=>{
      this.findxy('out', e);
    });
  }

  public reconocer() {
    this.nnInput = this._utils.recognize(this.ctx,this.canvas);
    this.nn(this.nnInput, w12, bias2, w23, bias3);
    
  }

  public nn(data, w12, bias2, w23, bias3) {
    if (!Array.isArray(data) || data.length == 0 ||
      !Array.isArray(w12) || w12.length == 0 || !Array.isArray(w12[0]) || data.length != w12[0].length || !Array.isArray(bias2) || bias2.length != w12.length ||
      !Array.isArray(w23) || w23.length == 0 || !Array.isArray(w23[0]) || w12.length != w23[0].length || !Array.isArray(bias3) || bias3.length != w23.length) {
      console.error('nn(): invalid parameters');
      console.log('d: '+data.length+', w12: '+w12.length+', w12[0]: '+w12[0].length+', bias2: '+bias2.length+
                  ', w23: '+w23.length+', w23[0]: '+w23[0].length+', bias3: '+bias3.length);
      return undefined;
    }

    console.log('dimensiones :')
    console.log('data  =' + data.length)
    this.dataLenght = data.length;
    console.log('pesos 1 2 =' + w12.length + ' de ' + w12[0].length)
    this.w12Lenght = w12[0].length;
    console.log('bias2 = ' + bias2.length)
    this.bias2Lenght = bias2.length;
    console.log('pesos 2 3 =' + w23.length + ' de ' + w23[0].length)
    this.w23Lenght = w23[0].length;
    console.log('bias3 = ' + bias3.length)
    this.bias3Lenght = bias3.length;

    // compute layer2 output
    let out2 = [];
    for (let i=0; i<w12.length; i++) {
      out2[i] = bias2[i];
      for (let j=0; j<w12[i].length; j++) {
        out2[i] += data[j] * w12[i][j];
      }
      out2[i] = 1 / (1 + Math.exp(-out2[i]));
    }

    //compute layer3 activation
    let out3 = [];
    for (let i=0; i<w23.length; i++) {
      out3[i] = bias3[i];
      for (let j=0; j<w23[i].length; j++) {
        out3[i] += out2[j] * w23[i][j];
      }
    }

    let out3v2 = []
    out3.map(o => {
      console.log(o + 'fx=>' + (1/(1+Math.exp(-o))))
      out3v2.push((1/(1+Math.exp(-o))))
    })
    
    let max = Math.max.apply(null,out3v2);

    let numero = out3v2.indexOf(max);
    this.numero = numero;
    console.log('max :' + max);
    console.log('numero :' + numero);



  }

  public draw(ctx, color, lineWidth, x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.closePath();
  }

  public erase() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    // document.getElementById('nnOut').innerHTML = '';
  }

  public findxy(res, e) {
    if (res == 'down') {
      if (this.clearBeforeDraw == true) {
        this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
          // falta los elementby ID
        this.paths = [];
        this.clearBeforeDraw = false;
      }
      if (e.pageX != undefined && e.pageY != undefined){
        this.currX = e.pageX-this.canvas.offsetLeft;
        this.currY = e.pageY-this.canvas.offsetTop;
      } else {
        this.currX = e.clientX + document.body.scrollLeft
        + document.documentElement.scrollLeft
        - this.canvas.offsetLeft;
        this.currY = e.clientY + document.body.scrollTop
        + document.documentElement.scrollTop
        - this.canvas.offsetTop;
      }
      //draw a circle
      this.ctx.beginPath();
      this.ctx.lineWidth = 1;
      this.ctx.arc(this.currX,this.currY,this.lineWidth/2,0,2*Math.PI);
      this.ctx.stroke();
      this.ctx.closePath();
      this.ctx.fill();
      this.paths.push([[this.currX], [this.currY]]);
      this.paintFlag = true;
    }
    
    if (res == 'up' || res == "out") {
      this.paintFlag = false;
    }

    if (res == 'move') {
      if (this.paintFlag) {
        // draw a line to previous point
        this.prevX = this.currX;
        this.prevY = this.currY;
        if (e.pageX != undefined && e.pageY != undefined) {
          this.currX = e.pageX-this.canvas.offsetLeft;
          this.currY = e.pageY-this.canvas.offsetTop;
        } else {
          this.currX = e.clientX + document.body.scrollLeft
          + document.documentElement.scrollLeft
          - this.canvas.offsetLeft;
          this.currY = e.clientY + document.body.scrollTop
          + document.documentElement.scrollTop
          - this.canvas.offsetTop;
        }
        //currPath = paths[paths.length-1];
        //currPath[0].push(currX);
        //currPath[1].push(currY);
        //paths[paths.length-1] = currPath;
        this.draw(this.ctx, this.color, this.lineWidth, this.prevX, this.prevY, this.currX, this.currY);
      }
    }

  }


}
