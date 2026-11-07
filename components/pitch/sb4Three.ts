import type { ContentLang } from '@/lib/sb4';

/**
 * "SB 4 in three sentences", static per language. Written from lib/sb4Facts.ts F1–F6:
 * who qualifies and when (F1, F2), how approval works (F3), who the homes are for and for how long (F4, F5, F6).
 */
export const SB4_THREE: Record<ContentLang, [string, string, string]> = {
  en: [
    'California SB 4 (2023) lets a religious institution or nonprofit college build affordable housing on land it owned on or before January 1, 2024, from July 2, 2024 through January 1, 2036.',
    'Projects that meet objective standards receive ministerial, by-right approval, with no discretionary review and no CEQA review.',
    'The homes are for lower-income households (up to 20% moderate-income and 5% for staff), secured by a 45-year deed restriction for ownership, at a minimum of 30 homes per acre in Orange County, or 40 where the zone does not allow housing.',
  ],
  es: [
    'La ley SB 4 de California (2023) permite que una institución religiosa o universidad sin fines de lucro construya vivienda asequible en terrenos que poseía el 1 de enero de 2024 o antes, del 2 de julio de 2024 al 1 de enero de 2036.',
    'Los proyectos que cumplen normas objetivas reciben aprobación ministerial, por derecho, sin revisión discrecional ni revisión bajo CEQA.',
    'Las viviendas son para hogares de bajos ingresos (hasta 20% de ingresos moderados y 5% para personal), protegidas por una restricción de escritura de 45 años en propiedad, con un mínimo de 30 viviendas por acre en el Condado de Orange, o 40 donde la zona no permite vivienda.',
  ],
  vi: [
    'Luật SB 4 của California (2023) cho phép tổ chức tôn giáo hoặc trường cao đẳng phi lợi nhuận xây nhà ở giá phải chăng trên đất đã sở hữu từ ngày 1 tháng 1 năm 2024 trở về trước, từ ngày 2 tháng 7 năm 2024 đến ngày 1 tháng 1 năm 2036.',
    'Dự án đáp ứng các tiêu chuẩn khách quan được phê duyệt hành chính theo quyền, không cần xét duyệt tùy nghi và không cần xét duyệt CEQA.',
    'Nhà dành cho hộ thu nhập thấp (tối đa 20% thu nhập trung bình và 5% cho nhân viên), được bảo đảm bằng hạn chế chứng thư 45 năm đối với nhà sở hữu, với mật độ tối thiểu 30 căn mỗi mẫu Anh tại Quận Cam, hoặc 40 căn nơi quy hoạch không cho phép nhà ở.',
  ],
  ko: [
    '캘리포니아 SB 4(2023)는 종교 기관이나 비영리 대학이 2024년 1월 1일 이전부터 소유한 토지에 저렴한 주택을 지을 수 있게 하며, 2024년 7월 2일부터 2036년 1월 1일까지 적용됩니다.',
    '객관적 기준을 충족하는 사업은 재량 심사와 CEQA 검토 없이 행정 승인을 권리로서 받습니다.',
    '주택은 저소득 가구를 위한 것이며(중간소득 최대 20%, 직원용 5%), 소유 주택은 45년 등기 제한으로 보호되고, 오렌지카운티 최소 밀도는 에이커당 30세대, 주거가 허용되지 않는 지역은 40세대입니다.',
  ],
};
