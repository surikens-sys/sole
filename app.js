// 솔솔 소개팅 연습: 화면 동작
// 대화 내용은 questions.js 에 있어요.

const MIDDLE_COUNT = 6; // 직업·MBTI 질문 말고 중간에 무작위로 나오는 질문 수
const GRADE_LABEL = { good: "좋아요", ok: "괜찮아요", bad: "아쉬워요" };
const RANDOM = "random";

const setup = document.getElementById("setup");
const chat = document.getElementById("chat");
const choices = document.getElementById("choices");
const progress = document.getElementById("progress");
const profile = document.getElementById("profile");

let partner = null; // { job: "nurse", mbti: "ISFJ" }
let round = [];     // 이번 연습에 뽑힌 질문들
let step = 0;       // 지금 몇 번째 질문인지 (0부터)

// 배열을 무작위로 섞은 새 배열을 돌려줘요
function shuffle(list) {
  const copy = list.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function pickOne(list) {
  return list[Math.floor(Math.random() * list.length)];
}

// 글 속의 {mbti}, {mbtiLine} 을 지수의 MBTI로 바꿔요
function fill(text) {
  return text.replaceAll("{mbti}", partner.mbti).replaceAll("{mbtiLine}", MBTI[partner.mbti]);
}

// ── 상대 고르기 화면 ──

// 고르기 버튼(칩) 만들기: 맨 앞은 항상 "무작위"
function makeChips(containerId, name, items) {
  const box = document.getElementById(containerId);
  [[RANDOM, "무작위"], ...items].forEach(([value, label], i) => {
    const input = document.createElement("input");
    input.type = "radio";
    input.name = name;
    input.value = value;
    input.id = name + "-" + value;
    input.checked = i === 0;
    const tag = document.createElement("label");
    tag.htmlFor = input.id;
    tag.textContent = label;
    box.append(input, tag);
  });
}

function chosen(name) {
  return document.querySelector('input[name="' + name + '"]:checked').value;
}

function showSetup() {
  setup.hidden = false;
  chat.hidden = true;
  choices.hidden = true;
  progress.textContent = "";
  profile.textContent = "오늘의 소개팅 상대를 골라주세요";
}

function startWithChoice() {
  const job = chosen("job");
  const mbti = chosen("mbti");
  partner = {
    job: job === RANDOM ? pickOne(Object.keys(JOBS)) : job,
    mbti: mbti === RANDOM ? pickOne(Object.keys(MBTI)) : mbti,
  };
  profile.textContent = "27살 · " + JOBS[partner.job] + " · " + partner.mbti;
  start();
}

// ── 대화 진행 ──

// 이번 연습에 쓸 질문 뽑기: 첫인사 1 → (직업·MBTI·중간 6개를 섞어서) → 마무리 1
function makeRound() {
  const middle = shuffle([
    JOB_TALK[partner.job],
    MBTI_QUESTION,
    ...shuffle(QUESTIONS.middles).slice(0, MIDDLE_COUNT),
  ]);
  return [pickOne(QUESTIONS.openers), ...middle, pickOne(QUESTIONS.closers)];
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
    add("bubble her", fill(text));
    if (then) then();
  }, 700);
}

// 지금 질문의 선택지 6개를 섞어서 보여주기
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
  choices.scrollTop = 0;
}

function askNext() {
  progress.textContent = step + 1 + " / " + round.length;
  herSays(round[step].her, showChoices);
}

// 선택지를 눌렀을 때
function pick(option) {
  choices.innerHTML = "";
  add("bubble me", option.say);
  herSays(option.reply, () => {
    addCoach(option);
    step++;
    setTimeout(step < round.length ? askNext : finish, 900);
  });
}

function addButton(text, className, onClick) {
  const btn = document.createElement("button");
  btn.className = className;
  btn.type = "button";
  btn.textContent = text;
  btn.onclick = onClick;
  choices.appendChild(btn);
}

// 다 하면
function finish() {
  progress.textContent = "끝";
  add("scene", "연습 끝! 다시 하면 새 질문이 무작위로 나와요.");
  choices.innerHTML = "";
  addButton("같은 상대와 다시 연습하기", "choice again", start);
  addButton("상대 바꾸기", "choice", showSetup);
}

// 지금 상대로 처음부터 시작
function start() {
  round = makeRound();
  step = 0;
  setup.hidden = true;
  chat.hidden = false;
  choices.hidden = false;
  chat.innerHTML = "";
  choices.innerHTML = "";
  add("scene", "토요일 오후 2시, 카페. 소개팅 상대 지수가 막 도착했어요.");
  askNext();
}

makeChips("jobChips", "job", Object.entries(JOBS));
makeChips("mbtiChips", "mbti", Object.keys(MBTI).map((type) => [type, type]));
document.getElementById("startBtn").onclick = startWithChoice;
document.getElementById("restart").onclick = showSetup;
showSetup();
