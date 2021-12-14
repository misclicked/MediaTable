const Jimp = require('jimp');
const fs = require('fs');
const path = require('path');
const closestColor  = require('closest-css-color');
const extractFrames = require('ffmpeg-extract-frames')
var mmm = require('mmmagic'),
Magic = mmm.Magic;
var argv = require('minimist')(process.argv.slice(2));
let width = 'w' in argv ? argv.w : 200;
let height = 'h' in argv ? argv.h : 0;
let fps = 'fps' in argv ? argv.fps : 1;
let frames = 'x' in argv ? argv.x : 1;
let compress = 'compress' in argv ? true : false;
let baha = 'baha' in argv ? true : false;
let noplay = 'noplay' in argv ? true : false;
if(baha){
    fps = 1;
    frames = 1;
}
let frameTime = 1000/fps;
let inputFile = "";
if(!argv._.length){
    console.log('missing file path');
}else{
    inputFile = argv._[0];
}
let main = async ()=>{
    var magic = new Magic();
    magic.detectFile(inputFile, async (err, result)=>{
        //console.log(result);
        const directory = 'frames';
        if(!fs.existsSync(directory))fs.mkdirSync(directory);
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
            input: inputFile,
            output: './frames/frame-%i.jpg',
            offsets: offsets
        })
        let payload = '<style type="text/css">td {padding: 1;  margin: 1;}</style> ';
        let tables = new Array(frames);
        console.log(tables);
        Promise.allSettled(filenames.map(async filename =>{
            await new Promise((resolve, reject)=>{
                if(fs.existsSync("./frames/frame-" + (filename+1) +".jpg"))
                    Jimp.read("./frames/frame-" + (filename+1) +".jpg").then(image=>{
                        if(baha)
                            tables[filename] = `<table>`
                        else{
                            if(filename==0)
                                tables[filename] = `<table style='' id='` + filename + `' width=70% cellspacing=0 cellpadding=0>`
                            else
                                tables[filename] = `<table style='display:none' id='` + filename + `' width=70% cellspacing=0 cellpadding=0>`
                        }
                        console.log(filename);
                        height = height ? height : Math.round(width*image.getHeight()/image.getWidth());
                        image.resize(width, height);
                        console.log(width + ' ' + height);
                        for(let i=0;i<height;i++){
                            tables[filename] += '<tr>'
                            for(let j=0;j<width;j++){
                                var color = "notusednotused";
                                if(compress)
                                    color = closestColor('#' + ('000000' + image.getPixelColor(j, i).toString(16).slice(0, -2)).slice(-6).toUpperCase());
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
                        resolve('hi');
                    })
                else
                    resolve('hi');
            })
        })).then(()=>{
            if(baha){
                payload = tables.join('');
                fs.writeFileSync('output.txt', payload.replace(/</g, '[').replace(/>/g, ']'));
            }
            else{
                payload += tables.join('');
                if(!noplay)
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
                fs.writeFileSync('output.html', payload);
            }
        });
    });
}
main();