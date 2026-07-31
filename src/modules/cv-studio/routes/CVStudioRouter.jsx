import { Navigate, Route, Routes } from "react-router";
import CVStudioPage from "../pages/CVStudioPage";

export default function CVStudioRouter() {
    return (
        <Routes>
            <Route index element={<CVStudioPage />} />
            <Route path="*" element={<Navigate replace to="/cv-studio" />} />
        </Routes>
    );
}
