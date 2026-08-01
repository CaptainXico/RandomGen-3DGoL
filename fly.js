// fly.js

AFRAME.registerComponent('player-fly', {
  schema: {
    speed: { type: 'number', default: 3 }
  },

  init() {
    console.log('player-fly init called');
    this.rig = document.querySelector('#camera-rig');
    console.log('rig found:', !!this.rig);
    this.keys = {
      space: false,
      shift: false
    };

    // Desktop key tracking
    window.addEventListener('keydown', (e) => {
      console.log('keydown:', e.code);
      if (e.code === 'Space') {
        this.keys.space = true;
        console.log('space pressed');
      }
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        this.keys.shift = true;
        console.log('shift pressed');
      }
    });

    window.addEventListener('keyup', (e) => {
      console.log('keyup:', e.code);
      if (e.code === 'Space') this.keys.space = false;
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') this.keys.shift = false;
    });
  },

  tick(time, delta) {
    if (!this.rig) return;

    const dt = delta / 1000;
    const pos = this.rig.getAttribute('position');

    if (this.keys.space) {
      pos.y += this.data.speed * dt;
    }
    if (this.keys.shift) {
      pos.y -= this.data.speed * dt;
    }

    this.rig.setAttribute('position', pos);
  }
});
