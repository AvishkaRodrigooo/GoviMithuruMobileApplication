import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';

const { width } = Dimensions.get('window');

const ParticleTextEffect = ({ words = ["WELCOME", "FARMER", "AGROMIND"] }) => {
  // We use a WebView to run the HTML5 Canvas particle animation in React Native
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <style>
        body, html {
          margin: 0;
          padding: 0;
          width: 100%;
          height: 100%;
          background-color: transparent;
          overflow: hidden;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        canvas {
          display: block;
        }
      </style>
    </head>
    <body>
      <canvas id="canvas"></canvas>
      <script>
        const words = ${JSON.stringify(words)};
        const canvas = document.getElementById("canvas");
        const ctx = canvas.getContext("2d");
        
        let animationRef;
        let particles = [];
        let frameCount = 0;
        let wordIndex = 0;
        // Moderate pixel steps for clear but not overly bloated text
        const pixelSteps = 5;
        const drawAsPoints = true;

        let mouse = { x: 0, y: 0, isPressed: false };

        function resize() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        window.addEventListener('resize', resize);
        resize();

        class Particle {
          constructor() {
            this.pos = { x: 0, y: 0 };
            this.vel = { x: 0, y: 0 };
            this.acc = { x: 0, y: 0 };
            this.target = { x: 0, y: 0 };
            this.closeEnoughTarget = 100;
            this.maxSpeed = 1.0;
            this.maxForce = 0.1;
            this.particleSize = 10;
            this.isKilled = false;
            this.startColor = { r: 0, g: 0, b: 0 };
            this.targetColor = { r: 0, g: 0, b: 0 };
            this.colorWeight = 0;
            this.colorBlendRate = 0.01;
          }

          move() {
            let proximityMult = 1;
            const distance = Math.sqrt(Math.pow(this.pos.x - this.target.x, 2) + Math.pow(this.pos.y - this.target.y, 2));

            if (distance < this.closeEnoughTarget) {
              proximityMult = distance / this.closeEnoughTarget;
            }

            const towardsTarget = {
              x: this.target.x - this.pos.x,
              y: this.target.y - this.pos.y,
            };

            const magnitude = Math.sqrt(towardsTarget.x * towardsTarget.x + towardsTarget.y * towardsTarget.y);
            if (magnitude > 0) {
              towardsTarget.x = (towardsTarget.x / magnitude) * this.maxSpeed * proximityMult;
              towardsTarget.y = (towardsTarget.y / magnitude) * this.maxSpeed * proximityMult;
            }

            const steer = {
              x: towardsTarget.x - this.vel.x,
              y: towardsTarget.y - this.vel.y,
            };

            const steerMagnitude = Math.sqrt(steer.x * steer.x + steer.y * steer.y);
            if (steerMagnitude > 0) {
              steer.x = (steer.x / steerMagnitude) * this.maxForce;
              steer.y = (steer.y / steerMagnitude) * this.maxForce;
            }

            this.acc.x += steer.x;
            this.acc.y += steer.y;

            this.vel.x += this.acc.x;
            this.vel.y += this.acc.y;
            this.pos.x += this.vel.x;
            this.pos.y += this.vel.y;
            this.acc.x = 0;
            this.acc.y = 0;
          }

          draw(ctx, drawAsPoints) {
            if (this.colorWeight < 1.0) {
              this.colorWeight = Math.min(this.colorWeight + this.colorBlendRate, 1.0);
            }

            const currentColor = {
              r: Math.round(this.startColor.r + (this.targetColor.r - this.startColor.r) * this.colorWeight),
              g: Math.round(this.startColor.g + (this.targetColor.g - this.startColor.g) * this.colorWeight),
              b: Math.round(this.startColor.b + (this.targetColor.b - this.startColor.b) * this.colorWeight),
            };

            ctx.fillStyle = \`rgb(\${currentColor.r}, \${currentColor.g}, \${currentColor.b})\`;
            if (drawAsPoints) {
              // Fine points for sharper text
              ctx.fillRect(this.pos.x, this.pos.y, 2.5, 2.5);
            } else {
              ctx.beginPath();
              ctx.arc(this.pos.x, this.pos.y, this.particleSize / 2, 0, Math.PI * 2);
              ctx.fill();
            }
          }

          kill(width, height) {
            if (!this.isKilled) {
              const randomPos = generateRandomPos(width / 2, height / 2, (width + height) / 2);
              this.target.x = randomPos.x;
              this.target.y = randomPos.y;

              this.startColor = {
                r: this.startColor.r + (this.targetColor.r - this.startColor.r) * this.colorWeight,
                g: this.startColor.g + (this.targetColor.g - this.startColor.g) * this.colorWeight,
                b: this.startColor.b + (this.targetColor.b - this.startColor.b) * this.colorWeight,
              };
              this.targetColor = { r: 0, g: 0, b: 0 };
              this.colorWeight = 0;
              this.isKilled = true;
            }
          }
        }

        function generateRandomPos(x, y, mag) {
          const randomX = Math.random() * window.innerWidth;
          const randomY = Math.random() * window.innerHeight;

          const direction = {
            x: randomX - x,
            y: randomY - y,
          };

          const magnitude = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
          if (magnitude > 0) {
            direction.x = (direction.x / magnitude) * mag;
            direction.y = (direction.y / magnitude) * mag;
          }

          return {
            x: x + direction.x,
            y: y + direction.y,
          };
        }

        function nextWord(word) {
          const offscreenCanvas = document.createElement("canvas");
          offscreenCanvas.width = canvas.width;
          offscreenCanvas.height = canvas.height;
          const offscreenCtx = offscreenCanvas.getContext("2d");

          offscreenCtx.fillStyle = "white";
          // Decrease font size safely so it doesn't bleed off screen edges
          let fontSize = Math.min(canvas.width / (word.length * 0.65), 75);
          if (fontSize < 30) fontSize = 30; 
          
          offscreenCtx.font = \`900 \${fontSize}px "Helvetica Neue", Arial, sans-serif\`;
          offscreenCtx.textAlign = "center";
          offscreenCtx.textBaseline = "middle";
          // Perfectly center the text
          offscreenCtx.fillText(word, canvas.width / 2, canvas.height / 2);

          const imageData = offscreenCtx.getImageData(0, 0, canvas.width, canvas.height);
          const pixels = imageData.data;

          // Vivid theme colors: Pure Green or Pure White for better contrast
          const isGreen = Math.random() > 0.5;
          const newColor = isGreen 
            ? { r: 16, g: 185, b: 129 }  // #10b981
            : { r: 255, g: 255, b: 255 }; // White

          let particleIndex = 0;
          const coordsIndexes = [];
          for (let i = 0; i < pixels.length; i += pixelSteps * 4) {
            coordsIndexes.push(i);
          }

          // Shuffle for random assignment
          for (let i = coordsIndexes.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [coordsIndexes[i], coordsIndexes[j]] = [coordsIndexes[j], coordsIndexes[i]];
          }

          for (const coordIndex of coordsIndexes) {
            const pixelIndex = coordIndex;
            const alpha = pixels[pixelIndex + 3];

            if (alpha > 0) {
              const x = (pixelIndex / 4) % canvas.width;
              const y = Math.floor(pixelIndex / 4 / canvas.width);

              let particle;

              if (particleIndex < particles.length) {
                particle = particles[particleIndex];
                particle.isKilled = false;
                particleIndex++;
              } else {
                particle = new Particle();
                const randomPos = generateRandomPos(canvas.width / 2, canvas.height / 2, (canvas.width + canvas.height) / 2);
                particle.pos.x = randomPos.x;
                particle.pos.y = randomPos.y;
                particle.maxSpeed = Math.random() * 5 + 3;
                particle.maxForce = particle.maxSpeed * 0.05;
                // Fine particles for sharper letter forms
                particle.particleSize = Math.random() * 2 + 1.5;
                particle.colorBlendRate = Math.random() * 0.03 + 0.01;
                particles.push(particle);
              }

              particle.startColor = {
                r: particle.startColor.r + (particle.targetColor.r - particle.startColor.r) * particle.colorWeight,
                g: particle.startColor.g + (particle.targetColor.g - particle.startColor.g) * particle.colorWeight,
                b: particle.startColor.b + (particle.targetColor.b - particle.startColor.b) * particle.colorWeight,
              };
              particle.targetColor = newColor;
              particle.colorWeight = 0;
              particle.target.x = x;
              particle.target.y = y;
            }
          }

          for (let i = particleIndex; i < particles.length; i++) {
            particles[i].kill(canvas.width, canvas.height);
          }
        }

        function animate() {
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          for (let i = particles.length - 1; i >= 0; i--) {
            const particle = particles[i];
            particle.move();
            particle.draw(ctx, drawAsPoints);

            if (particle.isKilled) {
              if (
                particle.pos.x < 0 ||
                particle.pos.x > canvas.width ||
                particle.pos.y < 0 ||
                particle.pos.y > canvas.height
              ) {
                particles.splice(i, 1);
              }
            }
          }

          // Handle touches
          if (mouse.isPressed) {
            particles.forEach((particle) => {
              const distance = Math.sqrt(
                Math.pow(particle.pos.x - mouse.x, 2) + Math.pow(particle.pos.y - mouse.y, 2),
              );
              if (distance < 50) {
                particle.kill(canvas.width, canvas.height);
              }
            });
          }

          frameCount++;
          // Change word every 210 frames (~3.5 seconds) for even MORE reading time
          if (frameCount % 210 === 0) {
            wordIndex = (wordIndex + 1) % words.length;
            nextWord(words[wordIndex]);
          }

          animationRef = requestAnimationFrame(animate);
        }

        // Touch events
        canvas.addEventListener("touchstart", (e) => {
            mouse.isPressed = true;
            const touch = e.touches[0];
            const rect = canvas.getBoundingClientRect();
            mouse.x = touch.clientX - rect.left;
            mouse.y = touch.clientY - rect.top;
        }, {passive: true});

        canvas.addEventListener("touchend", () => {
            mouse.isPressed = false;
        });

        canvas.addEventListener("touchmove", (e) => {
            if(mouse.isPressed){
                const touch = e.touches[0];
                const rect = canvas.getBoundingClientRect();
                mouse.x = touch.clientX - rect.left;
                mouse.y = touch.clientY - rect.top;
            }
        }, {passive: true});

        // Start
        setTimeout(() => {
            nextWord(words[0]);
            animate();
        }, 100);

      </script>
    </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      <WebView
        originWhitelist={['*']}
        source={{ html: htmlContent }}
        style={styles.webview}
        scrollEnabled={false}
        bounces={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        overScrollMode="never"
        containerStyle={styles.webviewContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: width,
    height: 250, 
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  webview: {
    backgroundColor: 'transparent',
    width: width,
    height: 250,
  },
  webviewContainer: {
    backgroundColor: 'transparent',
  }
});

export default ParticleTextEffect;
