import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import NotFound from "./pages/OtherPage/NotFound";
import UserProfiles from "./pages/User/UserProfiles";
// import Videos from "./pages/UiElements/Videos";
// import Images from "./pages/UiElements/Images";
// import Alerts from "./pages/UiElements/Alerts";
// import Badges from "./pages/UiElements/Badges";
// import Avatars from "./pages/UiElements/Avatars";
// import Buttons from "./pages/UiElements/Buttons";
import LineChart from "./pages/Charts/LineChart";
import BarChart from "./pages/Charts/BarChart";
import Calendar from "./pages/Calendar";
import FormElements from "./pages/Forms/FormElements";
import Blank from "./pages/Blank";
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
import PetList from "./pages/Pet/PetList";
import PetAdd from "./pages/Pet/PetAdd";
import PetEdit from "./pages/Pet/PetEdit";

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
            {/* Others Page */}
            <Route path="/profile" element={<UserProfiles />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/category" element={<Category />} />
            <Route path="/category/add" element={<CategoryAdd />} />
            <Route path="/category/edit/:id" element={<CategoryEdit />} />
            <Route path="/orders" element={<OrderPage />} />
            <Route path="/product" element={<Product />} />
            <Route path="/product/add" element={<ProductAdd />} />
            <Route
              path="/product/add-all-in-one"
              element={<ProductCreateAllInOne />}
            />
            <Route path="/product/edit/:id" element={<ProductEdit />} />
            <Route path="/service" element={<Service />} />
            <Route path="/service/add" element={<ServiceAdd />} />
            <Route path="/service/edit/:id" element={<ServiceEdit />} />
            <Route path="/pet/list" element={<PetList />} />
            <Route path="/pet/add" element={<PetAdd />} />
            <Route path="/pet/edit/:id" element={<PetEdit />} />
            <Route path="/blank" element={<Blank />} />
            {/* Forms */}
            <Route path="/form-elements" element={<FormElements />} />

            {/* Tables
            <Route path="/basic-tables" element={<BasicTables />} />
            {/* Ui Elements */}
            {/* <Route path="/alerts" element={<Alerts />} />
            <Route path="/avatars" element={<Avatars />} />
            <Route path="/badge" element={<Badges />} />
            <Route path="/buttons" element={<Buttons />} />
            <Route path="/images" element={<Images />} />
            <Route path="/videos" element={<Videos />} /> */}
            {/* Charts */}
            <Route path="/line-chart" element={<LineChart />} />
            <Route path="/bar-chart" element={<BarChart />} />
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
