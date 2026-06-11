import { Router } from 'express';
import { getPeBandData } from './peBandService';
import { TushareError } from './tushareClient';

export const marketRoutes = Router();

marketRoutes.get('/pe-band', async (req, res) => {
  try {
    const data = await getPeBandData({
      tsCode: typeof req.query.tsCode === 'string' ? req.query.tsCode : '',
      range: typeof req.query.range === 'string' ? req.query.range : undefined,
      startDate: typeof req.query.startDate === 'string' ? req.query.startDate : undefined,
      endDate: typeof req.query.endDate === 'string' ? req.query.endDate : undefined,
      multiples: typeof req.query.multiples === 'string' ? req.query.multiples : undefined,
    });
    res.json({ data });
  } catch (error) {
    if (error instanceof TushareError) {
      res.status(error.status).json({ error: { code: error.code, message: error.message } });
      return;
    }
    res.status(500).json({ error: { code: 'market_data_error', message: error instanceof Error ? error.message : 'PE 通道数据生成失败。' } });
  }
});
