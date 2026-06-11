const PINYIN_BY_CHAR: Record<string, string> = {阿: 'a', 爱: 'ai', 安: 'an', 昂: 'ang', 奥: 'ao', 八: 'ba', 白: 'bai', 百: 'bai', 板: 'ban', 邦: 'bang', 宝: 'bao', 北: 'bei', 本: 'ben', 比: 'bi', 碧: 'bi', 变: 'bian', 标: 'biao', 宾: 'bin', 波: 'bo', 博: 'bo', 渤: 'bo', 彩: 'cai', 餐: 'can', 沧: 'cang', 草: 'cao', 测: 'ce', 森: 'sen', 昌: 'chang', 长: 'chang', 常: 'chang', 超: 'chao', 车: 'che', 晨: 'chen', 成: 'cheng', 城: 'cheng', 池: 'chi', 赤: 'chi', 崇: 'chong', 川: 'chuan', 创: 'chuang', 春: 'chun', 次: 'ci', 达: 'da', 大: 'da', 德: 'de', 登: 'deng', 地: 'di', 电: 'dian', 东: 'dong', 动: 'dong', 都: 'du', 盾: 'dun', 多: 'duo', 恩: 'en', 发: 'fa', 方: 'fang', 飞: 'fei', 丰: 'feng', 峰: 'feng', 福: 'fu', 复: 'fu', 富: 'fu', 钢: 'gang', 港: 'gang', 高: 'gao', 格: 'ge', 工: 'gong', 股: 'gu', 光: 'guang', 广: 'guang', 贵: 'gui', 国: 'guo', 海: 'hai', 汉: 'han', 航: 'hang', 豪: 'hao', 合: 'he', 河: 'he', 恒: 'heng', 宏: 'hong', 洪: 'hong', 湖: 'hu', 华: 'hua', 化: 'hua', 环: 'huan', 黄: 'huang', 辉: 'hui', 惠: 'hui', 火: 'huo', 机: 'ji', 吉: 'ji', 集: 'ji', 济: 'ji', 嘉: 'jia', 佳: 'jia', 建: 'jian', 江: 'jiang', 交: 'jiao', 金: 'jin', 京: 'jing', 晶: 'jing', 酒: 'jiu', 九: 'jiu', 君: 'jun', 开: 'kai', 康: 'kang', 科: 'ke', 控: 'kong', 矿: 'kuang', 昆: 'kun', 莱: 'lai', 兰: 'lan', 蓝: 'lan', 老: 'lao', 乐: 'le', 雷: 'lei', 力: 'li', 丽: 'li', 联: 'lian', 良: 'liang', 林: 'lin', 柳: 'liu', 龙: 'long', 鲁: 'lu', 绿: 'lv', 旅: 'lv', 茅: 'mao', 美: 'mei', 蒙: 'meng', 民: 'min', 明: 'ming', 南: 'nan', 能: 'neng', 宁: 'ning', 农: 'nong', 欧: 'ou', 盘: 'pan', 平: 'ping', 浦: 'pu', 普: 'pu', 齐: 'qi', 企: 'qi', 汽: 'qi', 青: 'qing', 清: 'qing', 球: 'qiu', 全: 'quan', 泉: 'quan', 燃: 'ran', 人: 'ren', 日: 'ri', 荣: 'rong', 瑞: 'rui', 三: 'san', 山: 'shan', 陕: 'shan', 上: 'shang', 少: 'shao', 深: 'shen', 神: 'shen', 生: 'sheng', 石: 'shi', 实: 'shi', 食: 'shi', 首: 'shou', 数: 'shu', 水: 'shui', 顺: 'shun', 思: 'si', 苏: 'su', 太: 'tai', 泰: 'tai', 唐: 'tang', 特: 'te', 天: 'tian', 通: 'tong', 同: 'tong', 铜: 'tong', 万: 'wan', 王: 'wang', 威: 'wei', 维: 'wei', 卫: 'wei', 文: 'wen', 沃: 'wo', 五: 'wu', 西: 'xi', 祥: 'xiang', 小: 'xiao', 新: 'xin', 信: 'xin', 星: 'xing', 兴: 'xing', 徐: 'xu', 宣: 'xuan', 学: 'xue', 亚: 'ya', 烟: 'yan', 扬: 'yang', 药: 'yao', 冶: 'ye', 一: 'yi', 伊: 'yi', 银: 'yin', 英: 'ying', 永: 'yong', 友: 'you', 渝: 'yu', 宇: 'yu', 玉: 'yu', 元: 'yuan', 源: 'yuan', 粤: 'yue', 云: 'yun', 运: 'yun', 泽: 'ze', 张: 'zhang', 招: 'zhao', 浙: 'zhe', 振: 'zhen', 正: 'zheng', 证: 'zheng', 中: 'zhong', 重: 'zhong', 州: 'zhou', 珠: 'zhu', 资: 'zi', 紫: 'zi', 族: 'zu', 遵: 'zun', 行: 'hang', 台: 'tai'};

export function normalizeIndexToken(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function toPinyinTokens(value: string) {
  return Array.from(value).map((char) => {
    if (/^[a-z0-9]$/i.test(char)) return char.toLowerCase();
    return PINYIN_BY_CHAR[char] ?? '';
  }).filter(Boolean);
}

export function toPinyinFull(value: string) {
  return normalizeIndexToken(toPinyinTokens(value).join(''));
}

export function toPinyinInitials(value: string) {
  return normalizeIndexToken(toPinyinTokens(value).map((token) => token[0] ?? '').join(''));
}
