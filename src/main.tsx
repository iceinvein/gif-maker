import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App.tsx";
import { Provider } from "./provider.tsx";
import "@/styles/globals.css";

const root = document.getElementById("root");

if (!root) throw new Error("Root element not found");

ReactDOM.createRoot(root).render(
	<React.StrictMode>
		<BrowserRouter>
			<Provider>
				<App />
			</Provider>
		</BrowserRouter>
	</React.StrictMode>,
);
