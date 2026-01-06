import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Checkbox from "../form/input/Checkbox";
import Button from "../ui/button/Button";
import authApi from "../../services/api/authApi";
import Alert from "../ui/alert/Alert";

export default function SignInForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({
    identifier: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear field error when user types
    if (fieldErrors[name as keyof typeof fieldErrors]) {
      setFieldErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const errors = {
      identifier: "",
      password: "",
    };
    let isValid = true;

    // Validate identifier (email or username) - không được để trống
    if (!formData.identifier.trim()) {
      errors.identifier = t('auth.usernameRequired');
      isValid = false;
    }

    // Validate password theo backend:
    // - Không được để trống
    // - Tối thiểu 6 ký tự
    // - Phải chứa ít nhất: 1 chữ thường (a-z), 1 chữ HOA (A-Z), 1 số (0-9), 1 ký tự đặc biệt
    if (!formData.password) {
      errors.password = t('auth.passwordRequired');
      isValid = false;
    } else if (formData.password.length < 6) {
      errors.password = t('auth.passwordMinLength');
      isValid = false;
    } else {
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{6,}$/;
      if (!passwordRegex.test(formData.password)) {
        errors.password = t('auth.passwordComplexity');
        isValid = false;
      }
    }

    setFieldErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate form trước khi submit
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      await authApi.login(formData);
      // Đăng nhập thành công, chuyển hướng đến trang chủ
      navigate("/");
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="flex flex-col flex-1">
      <div className="w-full max-w-md pt-10 mx-auto">
        <Link
          to="/"
          className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ChevronLeftIcon className="size-5" />
          {t('common.back')} {t('nav.dashboard')}
        </Link>
      </div>
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              {t('auth.signIn')}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('auth.signInPrompt')}
            </p>
          </div>
          <div>
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                {error && (
                  <Alert variant="error" title={t('auth.loginFailed')} message={error} />
                )}
                <div>
                  <Label>
                    {t('auth.usernameOrEmail')} <span className="text-error-500">*</span>{" "}
                  </Label>
                  <Input
                    name="identifier"
                    value={formData.identifier}
                    onChange={handleInputChange}
                    placeholder={t('auth.emailPlaceholder')}
                  />
                  {fieldErrors.identifier && (
                    <p className="mt-1 text-sm text-red-600">
                      {fieldErrors.identifier}
                    </p>
                  )}
                </div>
                <div>
                  <Label>
                    {t('auth.password')} <span className="text-error-500">*</span>{" "}
                  </Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder={t('auth.enterPassword')}
                    />
                    <span
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                    >
                      {showPassword ? (
                        <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      ) : (
                        <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      )}
                    </span>
                  </div>
                  {fieldErrors.password && (
                    <p className="mt-1 text-sm text-red-600">
                      {fieldErrors.password}
                    </p>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Checkbox checked={isChecked} onChange={setIsChecked} />
                    <span className="block font-normal text-gray-700 text-theme-sm dark:text-gray-400">
                      {t('auth.keepLoggedIn')}
                    </span>
                  </div>
                  <Link
                    to="/reset-password"
                    className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
                  >
                    {t('auth.forgotPassword')}
                  </Link>
                </div>
                <div>
                  <Button
                    {...({ type: "submit" } as any)}
                    className="w-full"
                    size="sm"
                    disabled={isLoading}
                  >
                    {isLoading ? t('auth.signingIn') : t('auth.signIn')}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
