"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { api } from "@/lib/api";
import Cookies from "js-cookie";
import Image from "next/image";
import styles from "./login.module.css";
import bg from "@/assets/images/bg.png"

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});
type Form = z.infer<typeof schema>;

export default function LoginPage() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: Form) => {
    const { data } = await api.post("/auth/login", values);
    // backend devuelve token y setea cookie HttpOnly? Si no, guardamos:
    if (data?.token) Cookies.set("tutaller_token", data.token, { expires: 7 });
    window.location.href = "/";
  };

  return (
    <div className={styles.wrapper}>
      <Image src={bg} className={styles.background} alt="image background" ></Image>
      <div className={styles.card}>
          <h1 className={styles.title}>Ingresa a tu cuenta</h1>
          <p className={styles.description}>Por favor ingresa tu usuario y contraseña para continuar</p>
        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          <div className={styles.form__group}>
            <label className={styles.form__label} htmlFor="email">
              Correo electrónico:
            </label>
            <input id="email" className="" placeholder="email@mail.com" {...register("email")} />
            {errors.email && <p className="">{errors.email.message}</p>}
          </div>
          <div className={styles.form__group}>
            <label className={styles.form__label} htmlFor="email">
              Contraseña:
            </label>
            <input type="password" className="" placeholder="********" {...register("password")} />
            {errors.password && <p className="">{errors.password.message}</p>}
          </div>
          <button disabled={isSubmitting} className="button__primary">
            {isSubmitting ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
