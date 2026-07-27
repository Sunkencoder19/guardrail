
import { Router } from "express";

const router = Router();

router.get("/", (req, res) => {
    res.send("Guardrail API is running");
});

router.get("/about", (req, res) => {
    res.send("Welcome to Guardrail Backend");
});

router.get("/dumb", (req, res) => {
    res.send("Dummy Route");
});

export default router;