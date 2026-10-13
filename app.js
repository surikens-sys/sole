// 솔솔 소개팅 연습: 화면 동작
// 대화 내용은 questions.js 에 있어요.

const MIDDLE_COUNT = 3;   // 중간에 무작위로 나오는 일반 질문 수
const MY_FOCUS_COUNT = 2; // 내 MBTI 맞춤 질문 수 (네 글자 중 무작위)
const GRADE_LABEL = { good: "좋아요", ok: "괜찮아요", bad: "아쉬워요" };
const RANDOM = "random";

const setup = document.getElementById("setup");
const chat = document.getElementById("chat");
const choices = document.getElementById("choices");
const progress = document.getElementById("progress");
const profile = document.getElementById("profile");
const meter = document.getElementById("meter");
const avatar = document.getElementById("avatar");
const partnerName = document.getElementById("partnerName");

let partner = null; // { name: "서연", job: "nurse", mbti: "ISFJ", myMbti: "INTP" }
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

// 이름 끝 글자에 받침이 있으면 "이에요", 없으면 "예요" (서연이에요 / 지수예요)
function withIeyo(name) {
  const code = name.charCodeAt(name.length - 1) - 0xac00;
  const hasBatchim = code >= 0 && code <= 11171 && code % 28 !== 0;
  return name + (hasBatchim ? "이에요" : "예요");
}

// 글 속의 {name}, {mbti}, {myMbti} 같은 자리를 지금 상대와 내 정보로 바꿔요
function fill(text) {
  const m = partner.mbti;
  return text
    .replaceAll("{nameIs}", withIeyo(partner.name))
    .replaceAll("{name}", partner.name)
    .replaceAll("{mbtiLine}", MBTI[m])
    .replaceAll("{mbti}", m)
    .replaceAll("{traitEI}", MBTI_TRAITS[m[0]])
    .replaceAll("{traitSN}", MBTI_TRAITS[m[1]])
    .replaceAll("{traitTF}", MBTI_TRAITS[m[2]])
    .replaceAll("{traitJP}", MBTI_TRAITS[m[3]])
    .replaceAll("{myMbti}", partner.myMbti)
    .replaceAll("{myLine}", MBTI[partner.myMbti])
    .replaceAll("{myFirst}", partner.myMbti[0]);
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
  meter.style.width = "0";
  avatar.textContent = "♥";
  partnerName.textContent = "소개팅 상대";
  profile.textContent = "오늘의 소개팅 상대를 골라주세요";
}

function startWithChoice() {
  const name = chosen("name");
  const job = chosen("job");
  const mbti = chosen("mbti");
  const myMbti = chosen("my");
  partner = {
    name: name === RANDOM ? pickOne(NAMES) : name,
    job: job === RANDOM ? pickOne(Object.keys(JOBS)) : job,
    mbti: mbti === RANDOM ? pickOne(Object.keys(MBTI)) : mbti,
    myMbti: myMbti === RANDOM ? pickOne(Object.keys(MBTI)) : myMbti,
  };
  avatar.textContent = partner.name[0];
  partnerName.textContent = partner.name;
  profile.textContent = "27살 · " + JOBS[partner.job] + " · " + partner.mbti;
  start();
}

// ── 대화 진행 ──

// 이번 연습에 쓸 질문 10개 뽑기
// 첫인사 1 → (직업 1 · MBTI 2 · 내 MBTI 맞춤 2 · 중간 3 을 섞어서) → 마무리 1
// MBTI 질문 2개는 "MBTI 뭐예요?" 다음에 후속 질문이 바로 이어지도록 한 묶음으로 섞어요.
function makeRound() {
  const myFocus = shuffle(partner.myMbti.split(""))
    .slice(0, MY_FOCUS_COUNT)
    .map((letter) => ({ ...MY_MBTI_TALK[letter], focus: letter }));

  const groups = shuffle([
    [JOB_TALK[partner.job]],
    [MBTI_QUESTION, pickOne(MBTI_TALK)],
    ...myFocus.map((q) => [q]),
    ...shuffle(QUESTIONS.middles).slice(0, MIDDLE_COUNT).map((q) => [q]),
  ]);
  return [pickOne(QUESTIONS.openers), ...groups.flat(), pickOne(QUESTIONS.closers)];
}

// 대화창을 맨 아래(가장 최근 말)로 내리기
function scrollDown() {
  chat.scrollTop = chat.scrollHeight;
}

// 대화창에 한 줄 추가 (글자는 textContent 로 넣어서 안전하게)
function add(className, text) {
  const el = document.createElement("div");
  el.className = className;
  el.textContent = text;
  chat.appendChild(el);
  scrollDown();
  return el;
}

function addCoach(option) {
  const el = add("coach " + option.grade, "");
  const label = document.createElement("strong");
  const labelText = document.createElement("b");
  labelText.textContent = "코치 · " + GRADE_LABEL[option.grade];
  label.appendChild(labelText);
  const tip = document.createElement("span");
  tip.textContent = fill(option.tip);
  el.append(label, tip);
  scrollDown();
}

// 상대가 "입력 중…"을 잠깐 보여준 뒤 말하기
function herSays(text, then) {
  const typing = add("bubble her typing", "");
  typing.setAttribute("aria-label", "입력 중");
  typing.innerHTML = "<i></i><i></i><i></i>";
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
    btn.textContent = fill(option.say);
    btn.onclick = () => pick(option);
    choices.appendChild(btn);
  });
  choices.scrollTop = 0;
  scrollDown(); // 선택지가 생기면서 대화창이 줄어드니 다시 맨 아래로
}

function askNext() {
  progress.textContent = step + 1 + " / " + round.length;
  meter.style.width = (step / round.length) * 100 + "%";
  const focus = round[step].focus;
  if (focus) add("scene", "내 MBTI " + partner.myMbti + " 맞춤 질문 · " + focus + "형 연습");
  herSays(round[step].her, showChoices);
}

// 선택지를 눌렀을 때
function pick(option) {
  choices.innerHTML = "";
  add("bubble me", fill(option.say));
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
  meter.style.width = "100%";
  add("scene", "연습 끝! 다시 하면 새 질문이 무작위로 나와요.");
  choices.innerHTML = "";
  addButton("같은 상대와 다시 연습하기", "choice again", start);
  addButton("상대 바꾸기", "choice", showSetup);
  scrollDown();
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
  add("scene", "토요일 오후 2시, 카페. 소개팅 상대 " + partner.name + " 님이 막 도착했어요.");
  add("scene", "나는 " + partner.myMbti + " · 맞춤 질문이 섞여 나와요");
  askNext();
}

makeChips("nameChips", "name", NAMES.map((name) => [name, name]));
makeChips("jobChips", "job", Object.entries(JOBS));
makeChips("mbtiChips", "mbti", Object.keys(MBTI).map((type) => [type, type]));
makeChips("myChips", "my", Object.keys(MBTI).map((type) => [type, type]));
document.getElementById("startBtn").onclick = startWithChoice;
document.getElementById("restart").onclick = showSetup;
showSetup();
