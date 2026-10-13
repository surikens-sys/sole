// 솔솔 소개팅 연습: 화면 동작
// 대화 내용은 questions.js 에 있어요.

const ROUND_SIZE = 30;    // 한 판에 나오는 질문 수 (준비된 질문이 모자라면 있는 만큼)
const MY_FOCUS_COUNT = 4; // 내 MBTI 맞춤 질문 수 (네 글자 중에서)
const GRADE_LABEL = { good: "좋아요", ok: "괜찮아요", bad: "아쉬워요" };
const MOOD_BY_GRADE = { good: "happy", ok: "neutral", bad: "awkward" }; // 답 등급 → 상대 표정
const HAIR = { 지수: "#4a3530", 서연: "#2b2528", 하은: "#8a5a3c", 민지: "#5e4466", 유나: "#b9814f" };
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

// ── 상대 표정 일러스트 ──
// mood: default(기본 미소) / thinking(생각 중) / happy(좋아요) / neutral(괜찮아요) / awkward(아쉬워요)
const FACE_PARTS = {
  default:
    '<circle class="f-ink" cx="25" cy="37" r="1.9"/><circle class="f-ink" cx="39" cy="37" r="1.9"/>' +
    '<path class="f-line" d="M28 44.5 Q32 47.5 36 44.5"/>',
  thinking:
    '<circle class="f-ink" cx="27" cy="35.5" r="1.9"/><circle class="f-ink" cx="41" cy="35.5" r="1.9"/>' +
    '<path class="f-line" d="M30 46 L35 45.5"/>',
  happy:
    '<path class="f-line" d="M22.5 38 Q25 34.5 27.5 38"/><path class="f-line" d="M36.5 38 Q39 34.5 41.5 38"/>' +
    '<path class="f-mouth" d="M27 43.5 Q32 51 37 43.5 Z"/>' +
    '<ellipse class="f-blush strong" cx="21.5" cy="42" rx="3.4" ry="2"/><ellipse class="f-blush strong" cx="42.5" cy="42" rx="3.4" ry="2"/>' +
    '<path class="f-heart" d="M51 9 c-1.6-2.6-5.4-1.2-4.6 1.7 0.5 1.9 4.6 4.6 4.6 4.6 s4.1-2.7 4.6-4.6 c0.8-2.9-3-4.3-4.6-1.7z"/>',
  neutral:
    '<circle class="f-ink" cx="25" cy="37.5" r="1.7"/><circle class="f-ink" cx="39" cy="37.5" r="1.7"/>' +
    '<path class="f-line" d="M29 46 L35 46"/>',
  awkward:
    '<path class="f-line" d="M21 33.5 L27 32"/><path class="f-line" d="M43 33.5 L37 32"/>' +
    '<circle class="f-ink" cx="24" cy="38" r="1.7"/><circle class="f-ink" cx="38" cy="38" r="1.7"/>' +
    '<path class="f-line" d="M27 46.5 Q29.5 44.5 32 46.5 Q34.5 48.5 37 46.5"/>' +
    '<path class="f-sweat" d="M47.5 21 Q51 26.5 47.5 29 Q44 26.5 47.5 21 Z"/>',
};

function faceSvg(mood) {
  const hair = HAIR[partner.name] || "#4a3530";
  return (
    '<svg viewBox="0 0 64 64" style="--hair:' + hair + '">' +
    '<path class="f-hair" d="M12 38 C12 18 22 10 32 10 C42 10 52 18 52 38 L52 50 C52 54 48 56 44 56 L20 56 C16 56 12 54 12 50 Z"/>' +
    '<ellipse class="f-skin" cx="32" cy="36" rx="16" ry="17"/>' +
    '<path class="f-hair" d="M16 32 C16 20 24 15 32 15 C40 15 48 20 48 32 C44 27 38 24 33 23 C30 27 24 30 16 32 Z"/>' +
    '<ellipse class="f-blush" cx="21.5" cy="42" rx="3" ry="1.7"/><ellipse class="f-blush" cx="42.5" cy="42" rx="3" ry="1.7"/>' +
    (FACE_PARTS[mood] || FACE_PARTS.default) +
    "</svg>"
  );
}

// 위쪽 프로필 사진을 지금 표정으로 바꾸기
function setAvatar(mood) {
  avatar.innerHTML = faceSvg(mood);
  avatar.classList.add("has-face");
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
  avatar.classList.remove("has-face");
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
  setAvatar("default");
  partnerName.textContent = partner.name;
  profile.textContent = "27살 · " + JOBS[partner.job] + " · " + partner.mbti;
  start();
}

// ── 대화 진행 ──

// 이번 연습에 쓸 질문 뽑기 (최대 ROUND_SIZE 개)
// 꼭 나오는 것: 첫인사 1 · 직업 1 · "MBTI 뭐예요?"+후속 1 · 내 MBTI 맞춤 · 마무리 1
// 남은 자리는 일반 질문과 남은 MBTI 후속 질문을 섞어서 무작위로 채워요.
// MBTI 후속 질문은 항상 "MBTI 뭐예요?" 뒤에 나오도록 맞춰요.
function makeRound() {
  const myFocus = shuffle(partner.myMbti.split(""))
    .slice(0, MY_FOCUS_COUNT)
    .map((letter) => ({ ...MY_MBTI_TALK[letter], focus: letter }));

  const followUps = shuffle(MBTI_TALK);
  const firstFollowUp = followUps[0];
  const must = [JOB_TALK[partner.job], firstFollowUp, ...myFocus];

  // 첫인사·마무리·"MBTI 뭐예요?" 3자리를 빼고 남은 칸 수
  const freeSlots = Math.max(0, ROUND_SIZE - 3 - must.length);
  const extra = shuffle([...QUESTIONS.middles, ...followUps.slice(1)]).slice(0, freeSlots);

  const middle = shuffle([...must, ...extra]);
  // 첫 번째로 나오는 후속 질문 바로 앞에 "MBTI 뭐예요?"를 넣어요
  const firstIndex = middle.findIndex((q) => MBTI_TALK.includes(q));
  middle.splice(firstIndex, 0, MBTI_QUESTION);

  return [pickOne(QUESTIONS.openers), ...middle, pickOne(QUESTIONS.closers)];
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

// 상대 말풍선 한 줄: 왼쪽에 표정 얼굴 + 말풍선
function addHer(text, mood, typing) {
  const row = document.createElement("div");
  row.className = "her-row";
  const face = document.createElement("span");
  face.className = "face";
  face.setAttribute("aria-hidden", "true");
  face.innerHTML = faceSvg(mood);
  const bubble = document.createElement("div");
  bubble.className = "bubble her" + (typing ? " typing" : "");
  if (typing) {
    bubble.setAttribute("aria-label", "입력 중");
    bubble.innerHTML = "<i></i><i></i><i></i>";
  } else {
    bubble.textContent = text;
  }
  row.append(face, bubble);
  chat.appendChild(row);
  scrollDown();
  return row;
}

// 상대가 "입력 중…"을 잠깐 보여준 뒤 그 표정으로 말하기
function herSays(text, then, mood = "default") {
  const typing = addHer("", "thinking", true);
  setTimeout(() => {
    typing.remove();
    addHer(fill(text), mood, false);
    setAvatar(mood);
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
  }, MOOD_BY_GRADE[option.grade]);
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
