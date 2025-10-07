
import React from "react";
import { createRoot } from "react-dom/client";
import WeatherApp from "./WeatherApp";
import "./App.css";

const container = document.getElementById("root");
const root = createRoot(container);
root.render(<React.StrictMode><WeatherApp /></React.StrictMode>);
