const { Category, DEFAULT_CATEGORIES } = require('../models/Category');

// @desc    Get all categories (defaults + user custom)
// @route   GET /api/categories
exports.getCategories = async (req, res, next) => {
  try {
    const customCategories = await Category.find({ user: req.user.id });

    // Format system default categories
    const defaults = DEFAULT_CATEGORIES.map((cat) => ({
      ...cat,
      isCustom: false,
      _id: `default_${cat.name.replace(/\s+/g, '_').toLowerCase()}`,
    }));

    res.status(200).json({
      success: true,
      data: [...defaults, ...customCategories],
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create a new custom category
// @route   POST /api/categories
exports.createCategory = async (req, res, next) => {
  try {
    const { name, type = 'expense', icon = 'Tag', color = '#10b981' } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required',
      });
    }

    const trimmedName = name.trim();

    // Check if category already exists in defaults or user's custom
    const defaultExists = DEFAULT_CATEGORIES.some(
      (c) => c.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (defaultExists) {
      return res.status(400).json({
        success: false,
        message: 'A default category with this name already exists',
      });
    }

    const existingCustom = await Category.findOne({
      user: req.user.id,
      name: { $regex: new RegExp(`^${trimmedName}$`, 'i') },
    });

    if (existingCustom) {
      return res.status(400).json({
        success: false,
        message: 'You already have a category with this name',
      });
    }

    const category = await Category.create({
      user: req.user.id,
      name: trimmedName,
      type,
      icon,
      color,
      isCustom: true,
    });

    res.status(201).json({
      success: true,
      message: 'Custom category created successfully',
      data: category,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete custom category
// @route   DELETE /api/categories/:id
exports.deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found or cannot delete default categories',
      });
    }

    await category.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (err) {
    next(err);
  }
};
