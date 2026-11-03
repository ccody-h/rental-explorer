const knex = require("../db/knex");

// Erase all ratings in the database.
async function debugEraseRatings(req, res) {
  try {
    await knex("ratings").del();

    return res.status(200).json({
      message: "All ratings successfully erased.",
    });
  } catch (error) {
    console.error("Failed to erase ratings:", error);

    return res.status(500).json({
      error: true,
      message: "Failed to erase ratings",
    });
  }
}

// Formats date/time values
function formatDateTime(value) {
  if (!value) {
    return null;
  }

  return new Date(value).toISOString();
}

// Returns all ratings made by the current  user
async function getUserRatings(req, res) {
  try {
    const allowedQueryParams = ["page"];
    const queryParams = Object.keys(req.query);

    const invalidQueryParams = queryParams.filter(
      (param) => !allowedQueryParams.includes(param)
    );

    if (invalidQueryParams.length > 0) {
      return res.status(400).json({
        error: true,
        message: `Invalid query parameters: ${invalidQueryParams.join(
          ", "
        )}. Query parameters are not permitted.`,
      });
    }

    const { page = 1 } = req.query;

    if (!/^[1-9]\d*$/.test(String(page))) {
      return res.status(400).json({
        error: true,
        message:
          "Invalid page parameter. Must be an integer greater than or equal to 1.",
      });
    }

    const perPage = 20;
    const currentPage = Number(page);
    const offset = (currentPage - 1) * perPage;

    const totalResult = await knex("ratings")
      .where("user_id", req.user.id)
      .count({ total: "*" })
      .first();

    const total = Number(totalResult.total);

    const ratings = await knex("ratings")
      .where("user_id", req.user.id)
      .select("rental_id as rentalId", "rating", "comment", "date_time as dateTime")
      .orderBy("date_time", "desc")
      .limit(perPage)
      .offset(offset);

    const formattedRatings = ratings.map((row) => {
      const ratingObject = {
        rentalId: row.rentalId,
        rating: row.rating,
        dateTime: formatDateTime(row.dateTime),
      };

      if (row.comment !== null && row.comment !== undefined) {
        ratingObject.comment = row.comment;
      }

      return ratingObject;
    });

    const lastPage = Math.ceil(total / perPage) || 1;

    return res.status(200).json({
      data: formattedRatings,
      pagination: {
        total,
        lastPage,
        prevPage: currentPage > 1 ? currentPage - 1 : null,
        nextPage: currentPage < lastPage ? currentPage + 1 : null,
        perPage,
        currentPage,
        from: offset,
        to: offset + formattedRatings.length,
      },
    });
  } catch (error) {
    console.error("Failed to fetch user ratings:", error);

    return res.status(500).json({
      error: true,
      message: "Failed to fetch ratings",
    });
  }
}

// Returns the current user rating for a specific property
async function getRatingForRental(req, res) {
  try {
    const queryParams = Object.keys(req.query);

    if (queryParams.length > 0) {
      return res.status(400).json({
        error: true,
        message: `Invalid query parameters: ${queryParams.join(
          ", "
        )}. Query parameters are not permitted.`,
      });
    }

    const { id } = req.params;

    if (!/^[1-9]\d*$/.test(String(id))) {
      return res.status(404).json({
        error: true,
        message: "No rating exists with this rental ID.",
      });
    }

    const rating = await knex("ratings")
      .where({
        user_id: req.user.id,
        rental_id: Number(id),
      })
      .select("rating", "comment", "date_time as dateTime")
      .first();

    if (!rating) {
      return res.status(404).json({
        error: true,
        message: "No rating exists with this rental ID.",
      });
    }

    const responseObject = {
      rating: rating.rating,
      dateTime: formatDateTime(rating.dateTime),
    };

    if (rating.comment !== null && rating.comment !== undefined) {
      responseObject.comment = rating.comment;
    }

    return res.status(200).json(responseObject);
  } catch (error) {
    console.error("Failed to fetch rating:", error);

    return res.status(500).json({
      error: true,
      message: "Failed to fetch rating",
    });
  }
}

// Create/update the current user rating for a property
async function createOrUpdateRating(req, res) {
  try {
    const queryParams = Object.keys(req.query);

    if (queryParams.length > 0) {
      return res.status(400).json({
        error: true,
        message: `Invalid query parameters: ${queryParams.join(
          ", "
        )}. Query parameters are not permitted.`,
      });
    }

    const { id } = req.params;
    const { rating, comment } = req.body;

    if (!/^[1-9]\d*$/.test(String(id))) {
      return res.status(404).json({
        error: true,
        message: "No rental exists with this ID.",
      });
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({
        error: true,
        message: "Invalid rating. Rating must be an integer value between 1 and 5.",
      });
    }

    if (
      comment !== undefined &&
      (typeof comment !== "string" || comment.length < 1 || comment.length > 2000)
    ) {
      return res.status(400).json({
        error: true,
        message:
          "Invalid comment parameter. Comment must be a string 1-2000 characters long.",
      });
    }

    // Check that the property exists
    const rental = await knex("data").where("id", Number(id)).first();

    if (!rental) {
      return res.status(404).json({
        error: true,
        message: "No rental exists with this ID.",
      });
    }

    const now = new Date();

    const existingRating = await knex("ratings")
      .where({
        user_id: req.user.id,
        rental_id: Number(id),
      })
      .first();

    const ratingData = {
      rating,
      date_time: now,
      comment: comment === undefined ? null : comment,
    };

    if (existingRating) {
      await knex("ratings")
        .where({
          user_id: req.user.id,
          rental_id: Number(id),
        })
        .update(ratingData);
    } else {
      await knex("ratings").insert({
        user_id: req.user.id,
        rental_id: Number(id),
        ...ratingData,
      });
    }

    const responseObject = {
      rating,
      dateTime: now.toISOString(),
    };

    if (comment !== undefined) {
      responseObject.comment = comment;
    }

    return res.status(201).json(responseObject);
  } catch (error) {
    console.error("Failed to create/update rating:", error);

    return res.status(500).json({
      error: true,
      message: "Failed to save rating",
    });
  }
}

module.exports = {
  debugEraseRatings,
  getUserRatings,
  getRatingForRental,
  createOrUpdateRating,
};