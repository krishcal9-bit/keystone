/**
 * Rules-based Pitch Kit content used when Claude is unavailable (no key, timeout, refusal, bad JSON).
 * Every number comes from the engine; every legal statement matches lib/sb4Facts.ts.
 */
import type { Parcel, ContentLang } from './sb4';
import { recommendedScenario, impact, SB4 } from './sb4';

export const OBJECTION_IDS = ['parking', 'neighbors', 'liability', 'control', 'cost', 'timeline'] as const;
export type ObjectionId = (typeof OBJECTION_IDS)[number];
export type Objection = { id: ObjectionId; question: string; answer: string };

export type PitchNumbers = {
  name: string;
  city: string;
  buildableAcres: string;
  keptSpaces: number;
  parkingSpaces: number;
  homes: number;
  people: number;
  affordabilityYears: string;
  unitType: 'townhome' | 'flat';
  density: number;
};

const fmt = (n: number, locale: string) => new Intl.NumberFormat(locale).format(Number.isFinite(n) ? n : 0);
const LOCALE: Record<ContentLang, string> = { en: 'en-US', es: 'es-MX', vi: 'vi-VN', ko: 'ko-KR' };

export function pitchNumbers(parcel: Parcel, keepSpaces?: number, lang: ContentLang = 'en'): PitchNumbers {
  const s = recommendedScenario(parcel, keepSpaces);
  const im = impact(s.homes);
  return {
    name: parcel.displayName,
    city: parcel.city,
    buildableAcres: (Number.isFinite(s.buildable.acres) ? s.buildable.acres : 0).toFixed(1),
    keptSpaces: s.keepSpaces,
    parkingSpaces: parcel.parkingSpaces,
    homes: im.homes,
    people: im.people,
    affordabilityYears: fmt(im.affordabilityYears, LOCALE[lang]),
    unitType: s.capacity.type,
    density: s.capacity.density,
  };
}

/** Template letter in the congregation's language, filled with engine numbers. Under 260 words in every language. */
export function pitchLetterFallback(parcel: Parcel, lang: ContentLang, keepSpaces?: number): string {
  const n = pitchNumbers(parcel, keepSpaces, lang);
  const hasParking = n.parkingSpaces > 0;
  const homesF = fmt(n.homes, LOCALE[lang]);
  const peopleF = fmt(n.people, LOCALE[lang]);
  const keptF = fmt(n.keptSpaces, LOCALE[lang]);

  if (lang === 'es') {
    const tipo = n.unitType === 'townhome' ? 'casas adosadas de dos pisos' : 'departamentos de poca altura';
    return [
      `Estimados líderes de ${n.name}:`,
      `Les escribimos de parte de Hábitat para la Humanidad del Condado de Orange con una idea para conversar, no una propuesta cerrada. Su congregación ha servido a ${n.city} durante décadas, y el terreno que cuidan podría abrir la puerta a familias trabajadoras que hoy no pueden comprar una casa aquí.`,
      `Una ley estatal de 2023, SB 4, permite que una institución religiosa construya vivienda asequible en terrenos que poseía antes del 1 de enero de 2024, con aprobación ministerial y sin revisión discrecional ni CEQA, siempre que el proyecto cumpla normas objetivas. La ley está vigente hasta el 1 de enero de 2036.`,
      hasParking
        ? `Con su templo y edificios intactos, y conservando ${keptF} de sus ${fmt(n.parkingSpaces, 'es-MX')} espacios de estacionamiento, estimamos cerca de ${n.buildableAcres} acres construibles: espacio para aproximadamente ${homesF} hogares de Hábitat como ${tipo}, donde vivirían alrededor de ${peopleF} personas. Cada casa se vende a una familia calificada con una hipoteca asequible y queda protegida con una restricción de escritura de ${SB4.ownershipDeedYears} años.`
        : `Con su templo y edificios intactos, estimamos cerca de ${n.buildableAcres} acres construibles: espacio para aproximadamente ${homesF} hogares de Hábitat como ${tipo}, donde vivirían alrededor de ${peopleF} personas. Cada casa se vende a una familia calificada con una hipoteca asequible y queda protegida con una restricción de escritura de ${SB4.ownershipDeedYears} años.`,
      `Nada de esto es una decisión hoy. Si el consejo tiene interés, nos gustaría visitarles, escuchar qué debe permanecer igual y responder preguntas con honestidad. La confirmación legal corresponde a la ciudad y a sus asesores.`,
      `Con respeto y gratitud,`,
      `Equipo de alianzas de terreno, Hábitat para la Humanidad del Condado de Orange`,
    ].join('\n\n');
  }

  if (lang === 'vi') {
    const loai = n.unitType === 'townhome' ? 'nhà liền kề hai tầng' : 'căn hộ thấp tầng';
    return [
      `Kính gửi Ban lãnh đạo ${n.name},`,
      `Chúng tôi viết thư này thay mặt Habitat for Humanity of Orange County với một ý tưởng để cùng trao đổi, không phải một đề nghị đã định sẵn. Hội thánh của quý vị đã phục vụ ${n.city} trong nhiều thập kỷ, và phần đất quý vị đang gìn giữ có thể mở ra cơ hội cho những gia đình lao động hiện không thể mua nhà tại đây.`,
      `Luật tiểu bang SB 4 (2023) cho phép một tổ chức tôn giáo xây nhà ở giá phải chăng trên đất đã sở hữu trước ngày 1 tháng 1 năm 2024, với phê duyệt hành chính, không cần xét duyệt tùy nghi hay CEQA, miễn là dự án đáp ứng các tiêu chuẩn khách quan. Luật có hiệu lực đến ngày 1 tháng 1 năm 2036.`,
      hasParking
        ? `Giữ nguyên thánh đường và các tòa nhà hiện có, và giữ lại ${keptF} trong số ${fmt(n.parkingSpaces, 'vi-VN')} chỗ đậu xe, chúng tôi ước tính khoảng ${n.buildableAcres} mẫu Anh có thể xây dựng: đủ cho khoảng ${homesF} căn nhà Habitat dạng ${loai}, nơi khoảng ${peopleF} người có thể sinh sống. Mỗi căn được bán cho một gia đình đủ điều kiện với khoản vay thế chấp phải chăng và được bảo vệ bằng hạn chế chứng thư ${SB4.ownershipDeedYears} năm.`
        : `Giữ nguyên thánh đường và các tòa nhà hiện có, chúng tôi ước tính khoảng ${n.buildableAcres} mẫu Anh có thể xây dựng: đủ cho khoảng ${homesF} căn nhà Habitat dạng ${loai}, nơi khoảng ${peopleF} người có thể sinh sống. Mỗi căn được bán cho một gia đình đủ điều kiện với khoản vay thế chấp phải chăng và được bảo vệ bằng hạn chế chứng thư ${SB4.ownershipDeedYears} năm.`,
      `Không có điều gì ở đây cần quyết định ngay hôm nay. Nếu hội đồng quan tâm, chúng tôi mong được đến thăm, lắng nghe điều gì cần giữ nguyên và trả lời mọi câu hỏi một cách trung thực. Việc xác nhận pháp lý thuộc về thành phố và luật sư của quý vị.`,
      `Trân trọng và biết ơn,`,
      `Nhóm hợp tác đất đai, Habitat for Humanity of Orange County`,
    ].join('\n\n');
  }

  if (lang === 'ko') {
    const yuhyeong = n.unitType === 'townhome' ? '2층 타운홈' : '저층 공동주택';
    return [
      `${n.name} 지도자 여러분께,`,
      `오렌지카운티 해비타트(Habitat for Humanity of Orange County)를 대표하여, 확정된 제안이 아닌 함께 이야기 나누고 싶은 하나의 생각을 담아 편지를 드립니다. 여러분의 교회는 수십 년간 ${n.city}를 섬겨 왔으며, 여러분이 지켜 온 땅은 지금 이곳에서 집을 살 수 없는 근로 가정에게 문을 열어 줄 수 있습니다.`,
      `2023년 주법 SB 4는 종교 기관이 2024년 1월 1일 이전부터 소유한 토지에 저렴한 주택을 지을 수 있도록 허용하며, 객관적 기준을 충족하면 재량 심사나 CEQA 검토 없이 행정 승인을 받습니다. 이 법은 2036년 1월 1일까지 유효합니다.`,
      hasParking
        ? `예배당과 기존 건물을 그대로 두고 주차 공간 ${fmt(n.parkingSpaces, 'ko-KR')}면 중 ${keptF}면을 유지하면, 약 ${n.buildableAcres}에이커를 건축에 쓸 수 있다고 추정합니다. 이는 ${yuhyeong} 형태의 해비타트 주택 약 ${homesF}세대, 약 ${peopleF}명이 살 수 있는 규모입니다. 각 주택은 자격을 갖춘 가정에 부담 가능한 주택담보대출로 판매되며 ${SB4.ownershipDeedYears}년 등기 제한으로 보호됩니다.`
        : `예배당과 기존 건물을 그대로 두고, 약 ${n.buildableAcres}에이커를 건축에 쓸 수 있다고 추정합니다. 이는 ${yuhyeong} 형태의 해비타트 주택 약 ${homesF}세대, 약 ${peopleF}명이 살 수 있는 규모입니다. 각 주택은 자격을 갖춘 가정에 부담 가능한 주택담보대출로 판매되며 ${SB4.ownershipDeedYears}년 등기 제한으로 보호됩니다.`,
      `오늘 결정하실 일은 아무것도 없습니다. 이사회가 관심이 있으시다면 직접 찾아뵙고, 무엇을 그대로 지켜야 하는지 듣고, 모든 질문에 정직하게 답하고 싶습니다. 법적 확인은 시와 자문 변호사의 몫입니다.`,
      `존경과 감사를 담아,`,
      `토지 파트너십 팀, Habitat for Humanity of Orange County`,
    ].join('\n\n');
  }

  const type = n.unitType === 'townhome' ? 'two-story townhomes' : 'low-rise stacked flats';
  return [
    `Dear leaders of ${n.name},`,
    `We are writing on behalf of Habitat for Humanity of Orange County with an idea to talk through, not a finished proposal. Your congregation has served ${n.city} for decades, and the land you steward could open a door for working families who cannot buy a home here today.`,
    `A 2023 state law, SB 4, lets a religious institution build affordable housing on land it owned before January 1, 2024, with ministerial approval and no discretionary or CEQA review, as long as the project meets objective standards. The law is in effect through January 1, 2036.`,
    hasParking
      ? `With your sanctuary and buildings untouched, and keeping ${keptF} of your ${fmt(n.parkingSpaces, 'en-US')} parking spaces, we estimate about ${n.buildableAcres} buildable acres: room for roughly ${homesF} Habitat homes as ${type}, where about ${peopleF} people would live. Each home is sold to a qualified family with an affordable mortgage and protected by a ${SB4.ownershipDeedYears}-year deed restriction.`
      : `With your sanctuary and buildings untouched, we estimate about ${n.buildableAcres} buildable acres: room for roughly ${homesF} Habitat homes as ${type}, where about ${peopleF} people would live. Each home is sold to a qualified family with an affordable mortgage and protected by a ${SB4.ownershipDeedYears}-year deed restriction.`,
    `None of this is a decision today. If the board is interested, we would like to visit, hear what must stay exactly as it is, and answer questions honestly. Legal confirmation belongs to the city and your counsel.`,
    `With respect and gratitude,`,
    `Land partnerships team, Habitat for Humanity of Orange County`,
  ].join('\n\n');
}

/** Six honest board answers grounded in SB 4 facts and the Habitat model. */
export function objectionsFallback(parcel: Parcel, keepSpaces?: number): Objection[] {
  const n = pitchNumbers(parcel, keepSpaces, 'en');
  const parkingAnswer = n.parkingSpaces > 0
    ? `The plan keeps ${n.keptSpaces} of your ${n.parkingSpaces} spaces, and that number is yours to set. Before anyone commits, Habitat counts cars on your busiest day of the year so the kept spaces match real use, not a guess. If the count says you need more, the home count comes down and we show you the new number.`
    : `This site has no surface parking to lose, so the homes sit on open land and the sanctuary stays as it is. If street parking on service days is the real concern, we study it with you before any plan is drawn.`;
  return [
    { id: 'parking', question: 'Where will our members park on Sunday?', answer: parkingAnswer },
    { id: 'neighbors', question: 'What will the neighbors say?', answer: `Some will worry, and they deserve a straight answer: these are owner-occupied homes for working families who already live and work in ${n.city}, sold with an affordable mortgage, not rentals that change hands. SB 4 gives ministerial approval, so the project is not decided at a contested hearing, but Habitat still holds neighborhood meetings because the families will live next door for decades.` },
    { id: 'liability', question: 'What is our liability if something goes wrong?', answer: `Habitat is the developer and builder and carries the construction insurance; the congregation is not building anything. SB 4 requires a Phase I environmental site assessment before the project proceeds (a Phase II if the Phase I warrants it), which protects you as much as the families. Your own counsel reviews every agreement before you sign; nothing here is legal advice.` },
    { id: 'control', question: 'Are we giving up control of our land?', answer: `No decision is made today, and the structure is yours to choose: a long-term ground lease that keeps title with the congregation, a sale of only the portion used for homes, or a partnership agreement. The sanctuary and every existing building stay yours. The homes are deed-restricted for 45 years to remain affordable, which is a commitment the families make, not a lien on your campus.` },
    { id: 'cost', question: 'What does this cost us?', answer: `Habitat funds the predevelopment work, the construction and the mortgages; it builds with donations, volunteers and the families' own sweat equity. The congregation is not asked to pay for studies or construction. The real cost is time and attention from your leadership, and we try to keep that honest by bringing numbers, not asks, to every meeting.` },
    { id: 'timeline', question: 'How long would this take?', answer: `Because SB 4 approval is ministerial, there is no rezoning or CEQA process, which typically removes years from the schedule. A realistic path is roughly six to nine months of board conversation, title check, Phase I and city pre-application, then design and permits, then construction in phases. The law stays in effect through January 1, 2036, so there is time to do this carefully, and the plan would be about ${n.homes} homes on ${n.buildableAcres} buildable acres.` },
  ];
}

/** Static skeptical-but-fair board member turns; index = how many board turns have already been given. */
export const PRACTICE_TURNS: readonly string[] = [
  `Thank you for coming. I will be direct: this congregation has been on this corner since before most of our members were born, and our parking lot fills up every Sunday and twice at Easter. Why should we give up any of it for a project we did not ask for?`,
  `I hear that, and I appreciate the honesty about counting cars. But our neighbors have fought every apartment proposal on this street for twenty years. What happens to our relationship with them when the first bulldozer shows up, and why is that our problem to carry?`,
  `Fair enough on the neighbors. My bigger worry is the land itself. Once homes are built on it, that land is never coming back to us. How do we keep any real say over what happens there in thirty years, and what stops this from becoming something we never agreed to?`,
  `Let me ask the question the finance committee will ask me. We have a roof that leaks and a budget that barely closes. Where does the money for studies, lawyers and construction come from, and what exactly are you asking us to put on the line?`,
  `You have given us more to think about than I expected. One last thing: our members are tired of promises that take a decade. If the board said yes in principle next month, what would actually happen in the first year, and when would the first family move in?`,
];

export function practiceTurnFallback(boardTurnsSoFar: number): string {
  return PRACTICE_TURNS[Math.min(Math.max(0, boardTurnsSoFar), PRACTICE_TURNS.length - 1)];
}

export function practiceFeedbackFallback(staffAnswers: string[]): string {
  const total = staffAnswers.join(' ');
  const mentionedParking = /park/i.test(total);
  const mentionedSB4 = /sb ?4|by.right|ministerial/i.test(total);
  const mentionedFamilies = /famil|mortgage|own/i.test(total);
  const mentionedControl = /lease|title|control|agreement|terms/i.test(total);
  const landed: string[] = [];
  const tighten: string[] = [];
  if (mentionedFamilies) landed.push('You kept the families at the center, which is what a board remembers after the meeting.');
  if (mentionedParking) landed.push('Promising a real parking count before any commitment took the heat out of the first objection.');
  if (mentionedSB4) landed.push('Naming SB 4 and ministerial approval gave the board a reason to believe the timeline.');
  if (!mentionedControl) tighten.push('Say early that the sanctuary and title stay with the congregation, and name the structures on the table (ground lease, partial sale, partnership); the control question is the one that sinks these conversations.');
  if (!mentionedParking) tighten.push('Give a specific kept-parking number and offer to count cars on their busiest Sunday; a number beats reassurance.');
  if (!mentionedSB4) tighten.push('Mention that SB 4 approval is ministerial and that a Phase I environmental assessment is required; it answers both the timeline and the liability worries.');
  tighten.push('Close every answer with a question back to the board. It keeps the meeting a conversation instead of a pitch.');
  if (landed.length === 0) landed.push('You stayed calm and answered each objection directly instead of deflecting, which builds trust with a skeptical board.');
  return `What landed\n${landed.map((s) => `- ${s}`).join('\n')}\n\nWhat to tighten\n${tighten.slice(0, 3).map((s) => `- ${s}`).join('\n')}\n\nRemember: nothing is decided in the first meeting. Your job is to earn the second one.`;
}
