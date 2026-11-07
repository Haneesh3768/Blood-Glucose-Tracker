import { Router } from "express";
import { readingsController } from "./readings.controller.js";
import {
  createReadingSchema,
  getReadingsQuerySchema,
  patchReadingSchema,
  updateReadingSchema,
} from "./readings.validator.js";
import { validateBody, validateQuery } from "../../middlewares/validate.js";
import { authenticate } from "../../middlewares/authMiddleware.js";

export const readingsRouter = Router();

// All reading endpoints require active session authentication
readingsRouter.use(authenticate);

readingsRouter.post("/", validateBody(createReadingSchema), readingsController.create);
readingsRouter.get("/", validateQuery(getReadingsQuerySchema), readingsController.list);
readingsRouter.get("/:id", readingsController.getById);
readingsRouter.patch("/:id", validateBody(patchReadingSchema), readingsController.update);
readingsRouter.put("/:id", validateBody(updateReadingSchema), readingsController.update);
readingsRouter.delete("/:id", readingsController.delete);
