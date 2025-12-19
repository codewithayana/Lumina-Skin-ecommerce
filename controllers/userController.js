import e from "express";

export const landingPage = async (req, res) => {
    console.log("🚀 landingPage function called")
  try {
    res.render("user/homePage", {
      title: "Home - Lumina Skin",
    });
  } catch (error) {
    // console.error("❌ Landing page error:", error);
    res.status(500).send("Error loading home page");
  }
};
 
export const LoginPage = async (req, res) => {
    console.log("🚀 LoginPage function called")
    try {
      res.render("user/loginPage", {
        title: "Login - Lumina Skin",
      });
    } catch (error) {
      // console.error("❌ Login page error:", error);  
      e.res.status(500).send("Error loading login page");
    }
  };

export const signupPage = async (req, res) => {
    console.log("🚀 signupPage function called")
    try {
      res.render("user/signupPage", {
        title: "Signup - Lumina Skin",
      });
    } catch (error) {
      // console.error("❌ Signup page error:", error);
      e.res.status(500).send("Error loading signup page");
    }
  };

