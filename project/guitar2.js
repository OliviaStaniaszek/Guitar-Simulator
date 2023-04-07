const context = new AudioContext();

let dampening = 0.99; //signal dampening amount

let dist = context.createWaveShaper();
dist.curve = makeDistortionCurve(30);
let bandpass = context.createBiquadFilter();
let recorder = new Recorder(bandpass);


// http://stackoverflow.com/a/22313408/1090298
function makeDistortionCurve( amount ) {
    var k = typeof amount === 'number' ? amount : 0,
      n_samples = 44100,
      curve = new Float32Array(n_samples),
      deg = Math.PI / 180,
      i = 0,
      x;
    for ( ; i < n_samples; ++i ) {
      x = i * 2 / n_samples - 1;
      curve[i] = ( 3 + k ) * x * 20 * deg / ( Math.PI + k * Math.abs(x) );
    }
    return curve;
  };

function pluck(frequency){
    const pluck = context.createScriptProcessor(4096, 0, 1);

    //N is period of signal in samples    
    const N = Math.round(context.sampleRate / frequency); 

    //y is signal presently
    const y = new Float32Array(N);
    for( let i=0; i<N; i++){
        //fill with gaussian noise between -1,1
        y[i] = Math.random() *2 -1; 
    }

    let n=0;
    //callback produces sound signal
    pluck.onaudioprocess = function (e){
        //reference to outputBuffer
        const output = e.outputBuffer.getChannelData(0);
        
        //fill buffer with generated signal
        for (let i=0; i<e.outputBuffer.length; i++){
            //averages current sample with next sample
            // basically a lowpass filter with a frequency exactly half of sampling rate
            y[n] = (y[n] + y[(n + 1) % N]) / 2;

            //put actual sample into buffer
            output[i] = y[n];

            //hasten signal decay by applying dampening
            y[n] *= dampening;

            //counting constiables to help read current signal y
            n++;
            if(n >= N) n =0;
        }
    };

    //apply bandpass centred on target frequency to remove unwanted noise
    const bandpass = context.createBiquadFilter();
    bandpass.type = "bandpass";
    bandpass.frequency.value = frequency;
    bandpass.Q.value = 1;

    // const biquadFilter = context.createBiquadFilter({type:'lowpass', Q:-3.01});

    //connect scriptprocessornode to biquad 
    // pluck.connect(biquadFilter);
    // biquadFilter.connect(bandpass);
    pluck.connect(bandpass);

    //disconnect 
    setTimeout(() => {
        pluck.disconnect();
    }, 2000);
    setTimeout(() => {
        bandpass.disconnect();
    }, 2000);

    //return pluck
    return bandpass;
}





  // // Define the pluck function
  // async function pluck(frequency) {
  //   // Create the AudioWorkletNode
  //   await context.audioWorklet.addModule('pluckworklet.js');
  //   const pluckNode = new AudioWorkletNode(context, 'pluck-processor');
  //   pluckNode.parameters.get('frequency').value = frequency;
  //   pluckNode.connect(context.destination);
  
  //   // Apply bandpass filter
  //   const bandpass = context.createBiquadFilter();
  //   bandpass.type = 'bandpass';
  //   bandpass.frequency.value = frequency;
  //   bandpass.Q.value = 1;
  //   pluckNode.connect(bandpass);
  
  //   // Disconnect after 2 seconds
  //   setTimeout(() => {
  //     pluckNode.disconnect();
  //     bandpass.disconnect();
  //   }, 2000);
  
  //   return bandpass;
  // }

function playNote(stringfret){
    const dst = context.destination;

    let string = stringfret[0];
    let fret = stringfret[1];
    context.resume();
    pluck(getFrequency(string, fret)).connect(dst);
    
}

function getFrequency(string, fret){
    //concert A frequency
    const A = 110;

    //how far strings are tuned apart from A
    const offsets = [-5, 0, 5, 10, 14, 19];

    return A * Math.pow(2, (fret + offsets[string]) /12);
}


function strum(fret, stringCount = 6, stagger = 25) {
  // Reset dampening to the natural state
  dampening = 0.99;

  // Connect our strings to the sink
  const dst = context.destination;
  for (let index = 0; index < stringCount; index++) {
      if (Number.isFinite(fret[index])) {
          setTimeout(() => {
              pluck(getFrequency(index, fret[index])).connect(dst);
          }, stagger * index);
      }
  }
}

function playChord(frets){
    context.resume().then(strum(frets));
}



// recorder = new Recorder(bandpass);
function stopRecording(){
    recorder.stop();
    recorder.exportWAV(blob => audio.src = URL.createObjectURL(blob))
}
function startRecording(){
  context.resume();
  recorder.record();
}



