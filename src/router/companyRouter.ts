import { Router } from "express";
import { ObjectId } from "mongodb";
import { companyCollection, userCollection } from "../config/database.js";
import verifyToken from "../service/verifyToken.js";

const companyRouter = Router();

companyRouter.post("/create-company", verifyToken, async (req, res) => {
  try {
    const companyData = req.body;

    const user = await userCollection.findOne({
      _id: new ObjectId(companyData.ownerId),
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (user.role !== "company") {
      return res.status(403).json({
        success: false,
        message: "Only company accounts can create companies.",
      });
    }

    const result = await companyCollection.insertOne({
      ...companyData,
      ownerName: user.name,
      ownerEmail: user.email,
      role: user.role,

      createdAt: new Date(),
      updatedAt: new Date(),
    });

    res.status(201).json({
      success: true,
      message: "Company created successfully.",
      insertedId: result.insertedId,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal Server Error.",
    });
  }
});

companyRouter.get("/my-company/:id", verifyToken, async (req, res) => {
  try {
    const id = req.params.id as string;

    const companies = await companyCollection
      .find({ ownerId: new ObjectId(id) })
      .sort({ createdAt: -1 })
      .toArray();

    res.status(200).json({
      success: true,
      count: companies.length,
      data: companies,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
});

companyRouter.patch("/companies/edit/:id", verifyToken, async (req, res) => {
  try {
    const id = req.params.id as string;
    if (Array.isArray(id)) {
      return res.status(400).json({
        message: "Invalid id",
      });
    }

    const { name, industry, tagline, about, website, location, email, phone } =
      req.body;

    const company = await companyCollection.findOne({ _id: new ObjectId(id) });

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    const updateDoc = {
      $set: {
        name,
        industry,
        tagline,
        about,
        website,
        location,
        email,
        phone,
        updatedAt: new Date(),
      },
    };

    const result = await companyCollection.updateOne(
      { _id: new ObjectId(id) },
      updateDoc,
    );

    if (!result) {
      res.status(204).json({
        success: false,
        message: "Can't updating! Something was Wrong",
      });
    }

    res.status(200).json({
      success: true,
      message: "Company updated successfully",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update company",
    });
  }
});

export default companyRouter;
