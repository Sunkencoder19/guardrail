import { getDashboard } from "../services/dashboard.service.js";

export const getDashboardController = async (req, res, next) => {
  try {
    const dashboard = await getDashboard(req.user._id);

    res.status(200).json({
      success: true,
      data: dashboard,
    });
  } catch (error) {
    next(error);
  }
};