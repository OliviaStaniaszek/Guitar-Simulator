// initialises an audioContext
var recorder
var context = new AudioContext;
var Tone = new OscillatorNode(context, {frequency:820});
// creates four audio nodes
let Noise = new AudioBufferSourceNode(context,{loop:true}), //generates audio from a buffer - random noise continuously looped
    NoiseGain = new GainNode(context,{gain:0}), // controls volume of the noise
    delay = new DelayNode(context,{delayTime:0.5, maxDelayTime:2}), //dellays signal
    feedbackGain = new GainNode(context,{gain:0.8}) //controls amount of feedback fed into delay node
// creates buffer of audio data 'Noise' 
Noise.buffer = context.createBuffer(1,context.sampleRate,context.sampleRate)

// fills 'Noise' with random noise
for (i=0;i<context.sampleRate;i++) 
  Noise.buffer.getChannelData(0)[i] = 2*Math.random()-1
Tone.start()   

// step 4: low pass

// let biquadFilter = new BiquadFilterNode(context); 
const biquadFilter = context.createBiquadFilter({type:'lowpass', Q:-3.01});

// connects nodes together: Noise > NoiseGain > output & delay > feedbackGain > delay...

Tone.connect(NoiseGain)
// Noise.connect(NoiseGain)
NoiseGain.connect(context.destination)
// NoiseGain.connect(biquadFilter); //connect biquad
// biquadFilter.connect(delay);
// delay.connect(feedbackGain)
feedbackGain.connect(NoiseGain)
feedbackGain.connect(context.destination)

//event listeners - when input of these elements change, the corresponding function is executed
Source.onchange = function() { Tone.type = this.value }

Decay.oninput = function() {
  feedbackGain.gain.value=this.value
  DecayLabel.innerHTML = this.value
}
Delay.oninput = function() {
  delay.delayTime.value=0.001*this.value
  DelayLabel.innerHTML = this.value
}
Freq.oninput = function() {
  biquadFilter.frequency.value=this.value; //set frequency value to that of slider
  FreqLabel.innerHTML = this.value;
}

Width.oninput = function() { WidthLabel.innerHTML = this.value}


function playNote(freq) {
  console.log("play");
  context.resume()
  let now = context.currentTime
  biquadFilter.frequency.value = freq;
  NoiseGain.gain.setValueAtTime(0.5, now)
  NoiseGain.gain.linearRampToValueAtTime(0, now + Width.value/1000)
}


// Recording
recorder = new Recorder(feedbackGain) 
Start.onclick = () => {
  context.resume()
  recorder.record()
}
Stop.onclick = () => {
  recorder.stop()
  recorder.exportWAV(blob => document.querySelector("audio").src = URL.createObjectURL(blob) )
}
