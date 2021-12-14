const Jimp = require('jimp');
const fs = require('fs');
const path = require('path');
const closestColor  = require('closest-css-color');
const extractFrames = require('ffmpeg-extract-frames')
let width = 300;
let height = 75;
let fps = 23;
let frames = 300;
let frameTime = 1000/fps;
let main = async ()=>{
    const directory = 'frames';
    fs.readdir(directory, (err, files) => {
        if (err) throw err;
      
        for (const file of files) {
          fs.unlink(path.join(directory, file), err => {
            if (err) throw err;
          });
        }
      });
    let offsets = [];
    let filenames = [];
    for(var i=0;i<frames;i++){
        offsets.push(i*frameTime);
        filenames.push(i);
    }
    await extractFrames({
        input: 'input2.mp4',
        output: './frames/frame-%i.jpg',
        offsets: offsets
    })
    let payload = '<style type="text/css">td {padding: 1;  margin: 1;}</style> ';
    let tables = new Array(frames);
    console.log(tables);
    const promises = filenames.map(filename =>{
        return Jimp.read("./frames/frame-" + (filename+1) +".jpg").then(image=>{
            tables[filename] = `<table style='display:none' id='` + filename + `' width=70% height=70% cellspacing=0 cellpadding=0>`
            console.log(filename);
            height = Math.round(width*image.getHeight()/image.getWidth());
            image.resize(width, height);
            for(let i=0;i<height;i++){
                tables[filename] += '<tr>'
                for(let j=0;j<width;j++){
                    var color = closestColor('#' + ('000000' + image.getPixelColor(j, i).toString(16).slice(0, -2)).slice(-6).toUpperCase());
                    var color2 = '#' + ('000000' + image.getPixelColor(j, i).toString(16).slice(0, -2)).slice(-6).toUpperCase();
                    if(color.length>color2.length)
                    tables[filename] += '<td bgcolor='+color2+'></td>';
                    else
                    tables[filename] += '<td bgcolor='+color+'></td>';
                }
                tables[filename] += '</tr>'
            }
            tables[filename] += '</table>';
            console.log('done');
        })
    })
    await Promise.all(promises).then(()=>console.log('finished'));
    payload += tables.join('');
    payload += `
    <script>
        window.onload = ()=>{
            var last = null;
            setInterval(()=>{
                if(last)last.remove();
                document.getElementsByTagName('table')[0].style = "";
                last = document.getElementsByTagName('table')[0];
            }, `+ frameTime +` );
        };
        </script>
    `;
    fs.writeFile('output.html',payload,()=>{});
}
main();