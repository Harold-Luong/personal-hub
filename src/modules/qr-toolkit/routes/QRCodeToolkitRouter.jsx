import { Navigate, Route, Routes } from "react-router";
import QRCodeToolkitPage from "../pages/QRCodeToolkitPage";
export default function QRCodeToolkitRouter() {
    return <Routes><Route index element={<QRCodeToolkitPage />}/><Route path="*" element={<Navigate replace to="/tools/qr"/>}/></Routes>;
}
