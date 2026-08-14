import {
  startScan,
  getProjectScans,
  getAllScans,
  getScanById,
} from "../services/scan.service.js";

export const startScanController = async (req, res, next) => {
  try {
    const scan = await startScan(
      req.params.projectId,
      req.user._id
    );

    res.status(201).json({
      success: true,
      message: "Scan started successfully",
      data: scan,
    });
  } catch (error) {
    next(error);
  }
};

export const getProjectScansController = async (req, res, next) => {
  try {
    const scans = await getProjectScans(
      req.params.projectId,
      req.user._id
    );

    res.status(200).json({
      success: true,
      count: scans.length,
      data: scans,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllScansController = async (req, res, next) => {
  try {
    const scans = await getAllScans(req.user._id);

    res.status(200).json({
      success: true,
      count: scans.length,
      data: scans,
    });
  } catch (error) {
    next(error);
  }
};

export const getScanByIdController = async (req, res, next) => {
  try {
    const scan = await getScanById(
      req.params.scanId,
      req.user._id
    );

    res.status(200).json({
      success: true,
      data: scan,
    });
  } catch (error) {
    next(error);
  }
};