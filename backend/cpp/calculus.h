#pragma once
#include "polynomial.h"
#include <cmath>
#include <sstream>

struct CalculusResult {
    std::vector<double> coefficients;
    std::string expression;
    std::vector<StepResult> steps;
    double definiteValue;
    bool hasDefinite;
    std::string error;
};

class Calculus {
public:

    // Differentiation using Power Rule
    static CalculusResult differentiate(const Polynomial& p) {
        CalculusResult res;
        res.hasDefinite = false;
        res.definiteValue = 0;

        res.steps.push_back({"f(x) = " + p.toString(), "Original polynomial"});
        res.steps.push_back({"Apply the Power Rule: d/dx[axⁿ] = n·axⁿ⁻¹",
                              "Differentiate each term independently"});

        int deg = p.degree();
        std::vector<double> dCoeffs;

        if (deg == 0) {
            res.steps.push_back({"d/dx[" + p.toString() + "] = 0", "Derivative of a constant is 0"});
            dCoeffs.push_back(0.0);
        } else {
            dCoeffs.resize(deg, 0.0);
            for (int i = 1; i <= deg; i++) {
                if (std::abs(p.coeffs[i]) < 1e-12) continue;
                dCoeffs[i - 1] = i * p.coeffs[i];
                std::ostringstream step;
                step << "d/dx[" << Polynomial::formatNum(p.coeffs[i]) << "x^" << i << "] = "
                     << Polynomial::formatNum((double)i) << " × " << Polynomial::formatNum(p.coeffs[i])
                     << "x^" << (i - 1) << " = " << Polynomial::formatNum(dCoeffs[i - 1]);
                if (i - 1 > 0) step << "x^" << (i - 1);
                res.steps.push_back({step.str(), "Power rule: bring exponent down, reduce exponent by 1"});
            }
        }

        Polynomial derivative(dCoeffs);
        derivative.trim();
        res.coefficients = derivative.coeffs;
        res.expression = derivative.toString();
        res.steps.push_back({"f'(x) = " + res.expression, "Final derivative"});
        return res;
    }

    // Indefinite integration using Power Rule
    static CalculusResult integrate(const Polynomial& p) {
        CalculusResult res;
        res.hasDefinite = false;
        res.definiteValue = 0;

        res.steps.push_back({"∫ " + p.toString() + " dx", "Set up the integral"});
        res.steps.push_back({"Apply the Power Rule of Integration: ∫axⁿ dx = a·xⁿ⁺¹/(n+1) + C",
                              "Integrate each term independently"});

        int deg = p.degree();
        std::vector<double> iCoeffs(deg + 2, 0.0);

        for (int i = 0; i <= deg; i++) {
            if (std::abs(p.coeffs[i]) < 1e-12) continue;
            iCoeffs[i + 1] = p.coeffs[i] / (i + 1);
            std::ostringstream step;
            step << "∫ " << Polynomial::formatNum(p.coeffs[i]) << "x^" << i << " dx = "
                 << Polynomial::formatNum(p.coeffs[i]) << "/" << (i + 1) << " · x^" << (i + 1)
                 << " = " << Polynomial::formatNum(iCoeffs[i + 1]) << "x^" << (i + 1);
            res.steps.push_back({step.str(), "Power rule: increase exponent by 1, divide by new exponent"});
        }

        Polynomial integral(iCoeffs);
        integral.trim();
        res.coefficients = integral.coeffs;
        res.expression = integral.toString() + " + C";
        res.steps.push_back({"∫ f(x) dx = " + res.expression, "Final indefinite integral (C is constant of integration)"});
        return res;
    }

    // Definite integration from a to b using Fundamental Theorem of Calculus
    static CalculusResult definiteIntegral(const Polynomial& p, double a, double b) {
        CalculusResult res = integrate(p);
        res.hasDefinite = true;

        // Remove the "+ C" from expression for evaluation
        Polynomial integral(res.coefficients);

        double fa = integral.evaluate(a);
        double fb = integral.evaluate(b);
        res.definiteValue = fb - fa;

        std::ostringstream step1, step2, step3;
        step1 << "F(x) = " << integral.toString();
        step2 << "F(" << Polynomial::formatNum(b) << ") - F(" << Polynomial::formatNum(a) << ") = "
              << Polynomial::formatNum(fb) << " - (" << Polynomial::formatNum(fa) << ")";
        step3 << "= " << Polynomial::formatNum(res.definiteValue);

        res.steps.push_back({step1.str(), "Antiderivative (without C)"});
        res.steps.push_back({step2.str(), "Apply Fundamental Theorem: F(b) - F(a)"});
        res.steps.push_back({step3.str(), "Area under the curve from " + Polynomial::formatNum(a) + " to " + Polynomial::formatNum(b)});
        res.expression = Polynomial::formatNum(res.definiteValue);
        return res;
    }
};
