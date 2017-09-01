import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import 'rxjs/add/operator/map';

/*
  Generated class for the UtilsProvider provider.

  See https://angular.io/docs/ts/latest/guide/dependency-injection.html
  for more info on providers and Angular DI.
*/
@Injectable()
export class UtilsProvider {
  public grayscaleImg;
  constructor(public http: Http) {
    console.log('Hello UtilsProvider Provider');
  }

  public imageDataToGrayscale(imgData){
    let grayscaleImg = [];
    for( let y = 0; y < imgData.height; y++ ) {
        grayscaleImg[y]=[];
        for (let x = 0; x < imgData.width; x++) { 
          let offset = y * 4 * imgData.width + 4 * x;
          let alpha = imgData.data[offset+3];

          if (alpha == 0) {
            imgData.data[offset] = 255;
            imgData.data[offset+1] = 255;
            imgData.data[offset+2] = 255;
          }
          imgData.data[offset+3] = 255;
          grayscaleImg[y][x] = imgData.data[y*4*imgData.width + x*4 + 0] / 255;
        }
    }
    return grayscaleImg;
  }

  public getBoundingRectangle(img, threshold) {
    let rows = img.length;
    let columns = img[0].length;
    let minX=columns;
    let minY=rows;
    let maxX=-1;
    let maxY=-1;

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < columns; x++) {
        if (img[y][x] < threshold) {
          if (minX > x) minX = x;
          if (maxX < x) maxX = x;
          if (minY > y) minY = y;
          if (maxY < y) maxY = y;
        }
      }
    }
    
    let ejesMinimos = { minY: minY, minX: minX, maxY: maxY, maxX: maxX}
    return ejesMinimos;

  }

  public centerImage(img) {
    let meanX = 0;
    let meanY = 0;
    let rows = img.length;
    let columns = img[0].length;
    let sumPixels = 0;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < columns; x++) {
        let pixel = (1 - img[y][x]);
        sumPixels += pixel;
        meanY += y * pixel;
        meanX += x * pixel;
      }
    }
    meanX /= sumPixels;
    meanY /= sumPixels;

    let dY = Math.round(rows/2 - meanY);
    let dX = Math.round(columns/2 - meanX);
    let ejes = {transX: dX, transY: dY}
    return ejes
  }
  /*
  public scaleStrokeWidth() {
    for (var p = 0; p < paths.length; p++) {
      for (var i = 0; i < paths[p][0].length - 1; i++) {
        var x1 = paths[p][0][i];
        var y1 = paths[p][1][i];
        var x2 = paths[p][0][i+1];
        var y2 = paths[p][1][i+1];
        draw(copyCtx, color, lineWidth / scaling, x1, y1, x2, y2);
      }
    }
  }
  */

  public preprocessing(ctx, canvas, copyCtx, nnInput) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(copyCtx.canvas, 0, 0);
    for (let y = 0; y < 28; y++) {
      for (let x = 0; x < 28; x++) {
        let block = ctx.getImageData(x * 10, y * 10, 10, 10);
        let newVal = 255 * (0.5 - nnInput[x*28+y]/2);
        for (let i = 0; i < 4 * 10 * 10; i+=4) {
          block.data[i] = newVal;
          block.data[i+1] = newVal;
          block.data[i+2] = newVal;
          block.data[i+3] = 255;
        }
        ctx.putImageData(block, x * 10, y * 10);
      }
    }
  }

  public recognize(ctx,canvas) {
    let imgData = ctx.getImageData(0, 0, 280, 280);
    this.grayscaleImg = this.imageDataToGrayscale(imgData);
    let boundingRectangle =  this.getBoundingRectangle(this.grayscaleImg, 0.01);
    let trans = this.centerImage(this.grayscaleImg);
    let canvasCopy = document.createElement("canvas");
    canvasCopy.width = imgData.width;
    canvasCopy.height = imgData.height;
    let copyCtx = canvasCopy.getContext("2d");
    let brW = boundingRectangle.maxX+1-boundingRectangle.minX;
    let brH = boundingRectangle.maxY+1-boundingRectangle.minY;
    let scaling = 190 / (brW>brH?brW:brH);
    copyCtx.translate(canvas.width/2, canvas.height/2);
    copyCtx.scale(scaling, scaling);
    copyCtx.translate(-canvas.width/2, -canvas.height/2);
    copyCtx.translate(trans.transX, trans.transY);
    copyCtx.drawImage(ctx.canvas, 0, 0);

     // now bin image into 10x10 blocks (giving a 28x28 image)
     imgData = copyCtx.getImageData(0, 0, 280, 280);
     this.grayscaleImg = this.imageDataToGrayscale(imgData);
     let nnInput = new Array(784);
     for (let y = 0; y < 28; y++) {
      for (let x = 0; x < 28; x++) {
        var mean = 0;
        for (let v = 0; v < 10; v++) {
          for (let h = 0; h < 10; h++) {
            mean += this.grayscaleImg[y*10 + v][x*10 + h];
          }
        }
        mean = (1 - mean / 100); // average and invert
        nnInput[x*28+y] = (mean - .5) / .5;
      }
    }
    return nnInput;
  }


}
