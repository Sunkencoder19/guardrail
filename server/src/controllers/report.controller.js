import { getReport } from "../services/report.service.js";

export const getReportController = async (req, res, next) => {
  try {
    const report = await getReport(
      req.params.scanId,
      req.user._id
    );

    res.status(200).json({
      success: true,
      data: report,
    });
  } catch (error) {
    next(error);
  }
};