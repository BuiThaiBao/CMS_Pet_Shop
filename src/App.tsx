import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import NotFound from "./pages/OtherPage/NotFound";
import UserProfiles from "./pages/User/UserProfiles";
import Calendar from "./pages/ServiceCalendar/Calendar";
import AppointmentList from "./pages/ServiceCalendar/AppointmentList";
import AppLayout from "./layout/AppLayout";
import PrivateRouteAsync from "./components/common/PrivateRouteAsync";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Home from "./pages/Dashboard/Home";
import Category from "./pages/Category/Category";
import CategoryAdd from "./pages/Category/CategoryAdd";
import CategoryEdit from "./pages/Category/CategoryEdit";
import Product from "./pages/Product/Product";
import ProductAdd from "./pages/Product/ProductAdd";
import ProductEdit from "./pages/Product/ProductEdit";
import ProductCreateAllInOne from "./pages/Product/ProductCreateAllInOne";
import Service from "./pages/Service/Service";
import ServiceAdd from "./pages/Service/ServiceAdd";
import ServiceEdit from "./pages/Service/ServiceEdit";
import OrderPage from "./pages/Orders/Order";
import OrderDetail from "./pages/Orders/OrderDetail";
import PetList from "./pages/Pet/PetList";
import PetAdd from "./pages/Pet/PetAdd";
import PetEdit from "./pages/Pet/PetEdit";
import Adopt from "./pages/Pet/Adopt";
import AdoptDetail from "./pages/Pet/AdoptDetail";
import Report from "./pages/Dashboard/Report";
export default function App() {
  return (
    <>
      <Router>
        <ScrollToTop />
        <Routes>
          {/* Dashboard Layout - protected */}
          <Route
            element={
              <PrivateRouteAsync>
                <AppLayout />
              </PrivateRouteAsync>
            }
          >
            <Route index path="/" element={<Home />} />
            <Route path="/report" element={<Report />} />
            {/* Others Page */}
            <Route path="/profile" element={<UserProfiles />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/appointments" element={<AppointmentList />} />
            <Route path="/category" element={<Category />} />
            <Route path="/category/add" element={<CategoryAdd />} />
            <Route path="/category/edit/:id" element={<CategoryEdit />} />
            <Route path="/orders" element={<OrderPage />} />
            <Route path="/orders/:id" element={<OrderDetail />} />
            <Route path="/product" element={<Product />} />
            <Route path="/product/add" element={<ProductAdd />} />
            <Route
              path="/product/add-all-in-one"
              element={<ProductCreateAllInOne />}
            />
            <Route path="/adopt/:id" element={<AdoptDetail />} />
            <Route path="/product/edit/:id" element={<ProductEdit />} />
            <Route path="/service" element={<Service />} />
            <Route path="/service/add" element={<ServiceAdd />} />
            <Route path="/service/edit/:id" element={<ServiceEdit />} />
            <Route path="/pet/list" element={<PetList />} />
            <Route path="/pet/add" element={<PetAdd />} />
            <Route path="/pet/edit/:id" element={<PetEdit />} />
            <Route path="/adopt" element={<Adopt />} />
          </Route>

          {/* Auth Layout */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />

          {/* Fallback Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </>
  );
}
