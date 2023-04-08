
registerProcessor('pluck', class extends AudioWorkletProcessor {
    static get parameterDescriptors() { return [{name:'frequency',defaultValue:1000,minValue:0}] }
    constructor() {
      super();
      this.N = null;
      this.y = null;
      this.n = 0;
      this.dampening = 0.995;
      this.port.onmessage = this.handleMessage.bind(this);
    }
    process(inputs, outputs, parameters) {
      let input = inputs[0],output = outputs[0],coeff
      let frequency = parameters.frequency
      for (let channel = 0; channel < output.length; ++channel) {
        let inputChannel = input[channel],outputChannel = output[channel];
        coeff = 2 * Math.PI * frequency[0] / sampleRate
        for (let i = 0; i < outputChannel.length; ++i) {
          outputChannel[i]=inputChannel[i] * coeff +(1-coeff)*this.lastOut
          this.lastOut=outputChannel[i]
        }
      }
      return true
    }
  })