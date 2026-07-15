import { Navigate, Route, Routes } from "react-router";
import JsonToolkitPage from "../pages/JsonToolkitPage";

export default function JsonToolkitRouter() {
    return (
        <Routes>
            <Route index element={<JsonToolkitPage />} />
            <Route path="*" element={<Navigate replace to="/tools/json" />} />
        </Routes>
    );
}
