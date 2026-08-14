import {
  createFinding,
  getAllFindings,
  getScanFindings,
  getFindingById,
} from "../services/finding.service.js";

export const createFindingController = async (req, res, next) => {
  try {
    const finding = await createFinding(
      req.params.scanId,
      req.user._id,
      req.body,
    );

    res.status(201).json({
      success: true,
      message: "Finding created successfully",
      data: finding,
    });
  } catch (error) {
    next(error);
  }
};

export const getScanFindingsController = async (req, res, next) => {
  try {
    const result = await getScanFindings(
      req.params.scanId,
      req.user._id,
      req.query
    );

    res.status(200).json({
      success: true,
      count: result.findings.length,
      pagination: result.pagination,
      data: result.findings,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllFindingsController = async (req, res, next) => {
  try {
    const result = await getAllFindings(req.user._id, req.query);

    res.status(200).json({
      success: true,
      count: result.findings.length,
      pagination: result.pagination,
      severityCounts: result.severityCounts,
      data: result.findings,
    });
  } catch (error) {
    next(error);
  }
};

export const getFindingByIdController = async (req, res, next) => {
  try {
    const finding = await getFindingById(req.params.findingId, req.user._id);

    res.status(200).json({
      success: true,
      data: finding,
    });
  } catch (error) {
    next(error);
  }
};
