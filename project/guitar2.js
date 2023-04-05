const context = new AudioContext();

let dampening = 0.99; //signal dampening amount


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

    const biquadFilter = context.createBiquadFilter({type:'lowpass', Q:-3.01});

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

