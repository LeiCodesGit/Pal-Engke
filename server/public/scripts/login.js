const loginForm = document.getElementById("login-form");

loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email-input").value;
    const password = document.getElementById("password-input").value;

    try {
        const response = await axios.post("/auth/login", { email, password });

        if (response.data.user) {
            const userType = response.data.user.userType;

            if (userType === "admin") {
                window.location.href = "/admin/dashboard";
            } else {  
                window.location.href = "/home";
            }
        } else {
            alert(response.data.message || "Login failed");
        }
    } catch (error) {
        console.error(error);
        alert("Something went wrong. Please try again.");
    }
});