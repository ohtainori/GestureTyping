function getNextPose(char) {
  const charToCode = {
    "a":"01","b":"02","c":"03","d":"04","e":"05",
    "f":"11","g":"12","h":"13","i":"14","j":"15",
    "k":"21","l":"22","m":"23","n":"24","o":"25",
    "p":"31","q":"32","r":"33","s":"34","t":"35",
    "u":"41","v":"42","w":"43","x":"44","y":"45",
    "z":"51"," ":"52","backspace":"53",
  };
  const leftEmoji = {"0":"なし","1":"✊","2":"☝️","3":"✌️","4":"🤟","5":"🖐️"};
  const rightEmoji = {"1":"✊","2":"☝️","3":"✌️","4":"🤟","5":"🖐️"};
  let code = charToCode[char];
  if (!code) return null;
  return {
    left: leftEmoji[code[0]],
    right: rightEmoji[code[1]],
  };
}

function getCode(left_gesture, right_gesture) {
  let code_array = {
    "fist":  1,
    "one":   2,
    "peace": 3,
    "three": 4,
    "open":  5,
  }
  let left_code = code_array[left_gesture] || 0;
  let right_code = code_array[right_gesture];
  return String(left_code) + String(right_code);
}

function getCharacter(code) {
  const codeToChar = {
    "01": "a", "02": "b", "03": "c", "04": "d", "05": "e",
    "11": "f", "12": "g", "13": "h", "14": "i", "15": "j",
    "21": "k", "22": "l", "23": "m", "24": "n", "25": "o",
    "31": "p", "32": "q", "33": "r", "34": "s", "35": "t",
    "41": "u", "42": "v", "43": "w", "44": "x", "45": "y",
    "51": "z", "52": " ", "53": "backspace",
  };
  return codeToChar[code] || "";
}

// 入力サンプル文章 
let sample_texts = [
  "the quick brown fox jumps over the lazy dog",
];

let game_mode = {
  now: "notready",
  previous: "notready",
};

let game_start_time = 0;
let gestures_results;
let cam = null;
let p5canvas = null;

function setup() {
  p5canvas = createCanvas(320, 240);
  p5canvas.parent('#canvas');

  let lastChar = "";
  let lastCharTime = millis();

  gotGestures = function (results) {
    gestures_results = results;

    if (results.gestures.length >= 1) {
      if (game_mode.now == "ready" && game_mode.previous == "notready") {
        game_mode.previous = game_mode.now;
        game_mode.now = "playing";
        document.querySelector('input').value = "";
        game_start_time = millis();
      }

      let left_gesture = "none";
      let right_gesture = "none";

      for (let i = 0; i < results.gestures.length; i++) {
        let hand = results.handedness[i][0].categoryName;
        let gesture = results.gestures[i][0].categoryName;
        if (hand == "Left") {
          left_gesture = gesture;
        } else {
          right_gesture = gesture;
        }
      }

      let code = getCode(left_gesture, right_gesture);
      let c = getCharacter(code);

      let now = millis();
      if (c === lastChar) {
        if (now - lastCharTime > 1000) {
          let inputVal = document.querySelector('input').value;
          let target = sample_texts[0];
          let isCorrect = true;
          for (let i = 0; i < inputVal.length; i++) {
            if (inputVal[i] !== target[i]) { isCorrect = false; break; }
          }
          if (c === "backspace") {
            typeChar(c);
          } else if (isCorrect && c === target[inputVal.length]) {
            typeChar(c);
          }
          lastCharTime = now;
        }
      } else {
        lastChar = c;
        lastCharTime = now;
      }
    }
  }
}

// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
// ここから下は課題制作にあたって編集してはいけません。
// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

function typeChar(c) {
  if (c === "") {
    console.warn("Empty character received, ignoring.");
    return;
  }
  document.querySelector('input').focus();
  const input = document.querySelector('input');
  if (c === "backspace") {
    input.value = input.value.slice(0, -1);
  } else {
    input.value += c;
  }

  let inputValue = input.value;
  const messageElem = document.querySelector('#message');
  const target = messageElem.innerText;
  let matchLen = 0;
  for (let i = 0; i < Math.min(inputValue.length, target.length); i++) {
    if (inputValue[i] === target[i]) {
      matchLen++;
    } else {
      break;
    }
  }
  const matched = target.slice(0, matchLen);
  const unmatched = target.slice(matchLen);
  messageElem.innerHTML =
    `<span style="background-color:lightgreen">${matched}</span><span style="background-color:transparent">${unmatched}</span>`;

  if (document.querySelector('input').value == sample_texts[0]) {
    sample_texts.shift();
    if (sample_texts.length == 0) {
      game_mode.previous = game_mode.now;
      game_mode.now = "finished";
      document.querySelector('input').value = "";
      const elapsedSec = ((millis() - game_start_time) / 1000).toFixed(2);
      document.querySelector('#message').innerText = `Finished: ${elapsedSec} sec`;
    } else {
      document.querySelector('input').value = "";
      document.querySelector('#message').innerText = sample_texts[0];
    }
  }
}

function startWebcam() {
  if (window.setCameraStreamToMediaPipe) {
    cam = createCapture(VIDEO);
    cam.hide();
    cam.elt.onloadedmetadata = function () {
      window.setCameraStreamToMediaPipe(cam.elt);
    }
    p5canvas.style('width', '100%');
    p5canvas.style('height', 'auto');
  }

  if (game_mode.now == "notready") {
    game_mode.previous = game_mode.now;
    game_mode.now = "ready";
    document.querySelector('#message').innerText = sample_texts[0];
    game_start_time = millis();
  }
}

function draw() {
  background(127);
  if (cam) {
    image(cam, 0, 0, width, height);
  }

  if (gestures_results) {
    if (gestures_results.landmarks) {
      for (const landmarks of gestures_results.landmarks) {
        for (let landmark of landmarks) {
          noStroke();
          fill(100, 150, 210);
          circle(landmark.x * width, landmark.y * height, 10);
        }
      }
    }

    for (let i = 0; i < gestures_results.gestures.length; i++) {
      let name = gestures_results.gestures[i][0].categoryName;
      let pos = {
        x: gestures_results.landmarks[i][0].x * width,
        y: gestures_results.landmarks[i][0].y * height,
      };
      textSize(20);
      fill(0);
      textAlign(CENTER, CENTER);
      text(name, pos.x, pos.y);
    }
  }

  if (game_mode.now == "notready") {
    let msg = "Press the start button to begin";
    textSize(18);
    let tw = textWidth(msg) + 20;
    let th = 32;
    let tx = width / 2;
    let ty = height / 2;
    rectMode(CENTER);
    fill(255, 100);
    noStroke();
    rect(tx, ty, tw, th, 8);
    fill(0);
    textAlign(CENTER, CENTER);
    text(msg, tx, ty);
  }
  else if (game_mode.now == "ready") {
    let msg = "Waiting for gestures to start";
    textSize(18);
    let tw = textWidth(msg) + 20;
    let th = 32;
    let tx = width / 2;
    let ty = height / 2;
    rectMode(CENTER);
    fill(255, 100);
    noStroke();
    rect(tx, ty, tw, th, 8);
    fill(0);
    textAlign(CENTER, CENTER);
    text(msg, tx, ty);
  }
  else if (game_mode.now == "playing") {
    let elapsedSec = ((millis() - game_start_time) / 1000).toFixed(2);
    let msg = `${elapsedSec} [s]`;
    textSize(18);
    let tw = textWidth(msg) + 20;
    let th = 32;
    let tx = width / 2;
    let ty = th;
    rectMode(CENTER);
    fill(255, 100);
    noStroke();
    rect(tx, ty, tw, th, 8);
    fill(0);
    textAlign(CENTER, CENTER);
    text(msg, tx, ty);

    // 次のポーズ表示
    let inputVal = document.querySelector('input').value;
    let target = sample_texts[0];
    let isCorrect = true;
    for (let i = 0; i < inputVal.length; i++) {
      if (inputVal[i] !== target[i]) {
        isCorrect = false;
        break;
      }
    }
    let nextChar = isCorrect ? target[inputVal.length] : "backspace";
    if (nextChar) {
      let pose = getNextPose(nextChar);
      if (pose) {
        let hint = `次: "${nextChar}" → 左:${pose.left} 右:${pose.right}`;
        textSize(16);
        let hw = textWidth(hint) + 20;
        let hh = 30;
        rectMode(CENTER);
        fill(255, 230, 100, 220);
        noStroke();
        rect(width / 2, height - hh, hw, hh, 8);
        fill(0);
        textAlign(CENTER, CENTER);
        text(hint, width / 2, height - hh);
      }
    }
  }
  else if (game_mode.now == "finished") {
    let msg = "Game finished!";
    textSize(18);
    let tw = textWidth(msg) + 20;
    let th = 32;
    let tx = width / 2;
    let ty = height / 2;
    rectMode(CENTER);
    fill(255, 100);
    noStroke();
    rect(tx, ty, tw, th, 8);
    fill(0);
    textAlign(CENTER, CENTER);
    text(msg, tx, ty);
  }
}