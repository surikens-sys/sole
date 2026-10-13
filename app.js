// 솔솔 소개팅 연습: 화면 동작
// 대화 내용은 questions.js 에 있어요.

const ROUND_SIZE = 10; // 한 번 연습할 때 나오는 질문 수 (첫인사 1 + 중간 8 + 마무리 1)
const GRADE_LABEL = { good: "좋아요", ok: "괜찮아요", bad: "아쉬워요" };

const chat = document.getElementById("chat");
const choices = document.getElementById("choices");
const progress = document.getElementById("progress");

let round = []; // 이번 연습에 뽑힌 질문 10개
let step = 0;   // 지금 몇 번째 질문인지 (0부터)

// 배열을 무작위로 섞은 새 배열을 돌려줘요
function shuffle(list) {
  const copy = list.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// 이번 연습에 쓸 질문 10개 뽑기
function makeRound() {
  const middleCount = ROUND_SIZE - 2;
  return [
    shuffle(QUESTIONS.openers)[0],
    ...shuffle(QUESTIONS.middles).slice(0, middleCount),
    shuffle(QUESTIONS.closers)[0],
  ];
}

// 대화창에 한 줄 추가 (글자는 textContent 로 넣어서 안전하게)
function add(className, text) {
  const el = document.createElement("div");
  el.className = className;
  el.textContent = text;
  chat.appendChild(el);
  chat.scrollTop = chat.scrollHeight;
  return el;
}

function addCoach(option) {
  const el = add("coach " + option.grade, "");
  const label = document.createElement("strong");
  label.textContent = "코치 · " + GRADE_LABEL[option.grade];
  const tip = document.createElement("span");
  tip.textContent = option.tip;
  el.append(label, tip);
  chat.scrollTop = chat.scrollHeight;
}

// 지수가 "입력 중…"을 잠깐 보여준 뒤 말하기
function herSays(text, then) {
  const typing = add("bubble her typing", "입력 중…");
  setTimeout(() => {
    typing.remove();
    add("bubble her", text);
    if (then) then();
  }, 700);
}

function updateProgress() {
  progress.textContent = Math.min(step + 1, round.length) + " / " + round.length;
}

// 지금 질문의 선택지 3개를 섞어서 보여주기
function showChoices() {
  choices.innerHTML = "";
  const hint = document.createElement("p");
  hint.textContent = "뭐라고 답할까요?";
  choices.appendChild(hint);

  shuffle(round[step].options).forEach((option) => {
    const btn = document.createElement("button");
    btn.className = "choice";
    btn.type = "button";
    btn.textContent = option.say;
    btn.onclick = () => pick(option);
    choices.appendChild(btn);
  });
}

// 다음 질문으로
function askNext() {
  updateProgress();
  herSays(round[step].her, showChoices);
}

// 선택지를 눌렀을 때
function pick(option) {
  choices.innerHTML = "";
  add("bubble me", option.say);
  herSays(option.reply, () => {
    addCoach(option);
    step++;
    if (step < round.length) {
      setTimeout(askNext, 900);
    } else {
      setTimeout(finish, 900);
    }
  });
}

// 10개를 다 하면
function finish() {
  progress.textContent = "끝";
  add("scene", "연습 끝! 다시 하면 30개 중에서 새 질문 10개가 나와요.");
  choices.innerHTML = "";
  const again = document.createElement("button");
  again.className = "choice again";
  again.type = "button";
  again.textContent = "새 질문으로 다시 연습하기";
  again.onclick = start;
  choices.appendChild(again);
}

// 처음부터 시작
function start() {
  round = makeRound();
  step = 0;
  chat.innerHTML = "";
  choices.innerHTML = "";
  add("scene", "토요일 오후 2시, 카페. 소개팅 상대가 막 도착했어요.");
  askNext();
}

document.getElementById("restart").onclick = start;
start();
