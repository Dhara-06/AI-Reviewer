const { processSubmissionReview } = require('../services/reviewService');

const submitProject = async (req, res, next) => {
  try {
    const { githubRepoUrl, projectDescription, submissionNotes, deploymentUrl } = req.body;
    const internId = req.user.role === 'intern' ? req.user.id : req.body.internId;

    if (!githubRepoUrl) {
      return res.status(400).json({ success: false, message: 'GitHub repository URL is required.' });
    }

    const result = await processSubmissionReview({
      internId,
      githubRepoUrl,
      projectDescription,
      submissionNotes,
      deploymentUrl,
    });

    res.status(201).json({
      success: true,
      message: 'Project submitted and analyzed successfully.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  submitProject,
};
