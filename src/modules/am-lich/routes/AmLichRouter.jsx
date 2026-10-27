import { Navigate, Route, Routes } from "react-router";
import AmLichPage from "../pages/AmLichPage";

export default function AmLichRouter() {
    return (
        <Routes>
            <Route index element={<AmLichPage />} />
            <Route path="*" element={<Navigate replace to="/am-lich" />} />
        </Routes>
    );
}
