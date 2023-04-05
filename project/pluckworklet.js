// Define the AudioWorklet processor
// class PluckProcessor extends AudioWorkletProcessor {
  // Register the AudioWorklet processor
registerProcessor('pluck-processor', class extends AudioWorkletProcessor{
    constructor() {
      super();
      this.N = null;
      this.y = null;
      this.n = 0;
      this.dampening = 0.995;
      this.port.onmessage = this.handleMessage.bind(this);
    }
  
    static get parameterDescriptors() {
      return [
        {
          name: 'frequency',
          defaultValue: 440,
        },
      ];
    }
  
    handleMessage(event) {
      const { frequency } = event.data;
      this.N = Math.round(sampleRate / frequency);
      this.y = new Float32Array(this.N);
      for (let i = 0; i < this.N; i++) {
        this.y[i] = Math.random() * 2 - 1;
      }
    }
  
    process(inputs, outputs, parameters) {
        
      const output = outputs[0];
      const frequency = parameters.frequency[0];
    //   console.log(frequency);
      if (this.y) {
        for (let i = 0; i < output[0].length; i++) {
          this.y[this.n] = (this.y[this.n] + this.y[(this.n + 1) % this.N]) / 2;
          output[0][i] = this.y[this.n];
          this.y[this.n] *= this.dampening;
          this.n++;
          if (this.n >= this.N) this.n = 0;
        }
      }
      return true;
    }
  })
