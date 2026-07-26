#pragma once
#include "polynomial.h"
#include <complex>
#include <cmath>
#include <sstream>
#include <vector>

struct RootResult {
    std::vector<std::pair<double,double>> roots; // (real, imag)
    std::vector<StepResult> steps;
    std::vector<std::pair<double,double>> newtonTable; // (x, f(x)) iterations
    std::string error;
};

class RootFinder {
public:

    static RootResult solve(const Polynomial& p) {
        RootResult res;
        int deg = p.degree();

        if (deg == 0) {
            res.error = "Constant polynomial has no roots";
            return res;
        }

        if (deg == 1) return solveLinear(p);
        if (deg == 2) return solveQuadratic(p);
        if (deg == 3) return solveCubicNewton(p);
        return solveHighOrderNewton(p);
    }

    static RootResult solveLinear(const Polynomial& p) {
        RootResult res;
        // ax + b = 0  =>  x = -b/a
        double b = p.coeffs[0], a = p.coeffs[1];
        double x = -b / a;
        res.roots.push_back({x, 0.0});

        res.steps.push_back({p.toString() + " = 0", "Set polynomial equal to zero"});
        std::ostringstream s;
        s << Polynomial::formatNum(a) << "x = " << Polynomial::formatNum(-b);
        res.steps.push_back({s.str(), "Move constant to right side"});
        std::ostringstream r;
        r << "x = " << Polynomial::formatNum(-b) << " / " << Polynomial::formatNum(a)
          << " = " << Polynomial::formatNum(x);
        res.steps.push_back({r.str(), "Divide both sides by coefficient of x"});
        return res;
    }

    static RootResult solveQuadratic(const Polynomial& p) {
        RootResult res;
        double c = p.coeffs[0], b = p.coeffs[1], a = p.coeffs[2];

        res.steps.push_back({"Set polynomial equal to zero: " + p.toString() + " = 0", "Set polynomial equal to zero"});
        res.steps.push_back({"Use Quadratic Formula: x = (-b ± √(b²-4ac)) / 2a",
                              "Identify a=" + Polynomial::formatNum(a) + ", b=" + Polynomial::formatNum(b) + ", c=" + Polynomial::formatNum(c)});

        double discriminant = b * b - 4 * a * c;
        std::ostringstream dStep;
        dStep << "Discriminant Δ = b² - 4ac = (" << Polynomial::formatNum(b) << ")² - 4("
              << Polynomial::formatNum(a) << ")(" << Polynomial::formatNum(c) << ") = " << Polynomial::formatNum(discriminant);
        res.steps.push_back({dStep.str(), "Compute discriminant to determine root nature"});

        if (discriminant > 0) {
            double sqrtD = std::sqrt(discriminant);
            double x1 = (-b + sqrtD) / (2 * a);
            double x2 = (-b - sqrtD) / (2 * a);
            res.roots.push_back({x1, 0.0});
            res.roots.push_back({x2, 0.0});
            res.steps.push_back({"Δ > 0: Two distinct real roots", ""});
            std::ostringstream r;
            r << "x₁ = " << Polynomial::formatNum(x1) << ", x₂ = " << Polynomial::formatNum(x2);
            res.steps.push_back({r.str(), "Final roots"});
        } else if (std::abs(discriminant) < 1e-12) {
            double x = -b / (2 * a);
            res.roots.push_back({x, 0.0});
            res.steps.push_back({"Δ = 0: One repeated real root", ""});
            res.steps.push_back({"x = " + Polynomial::formatNum(x), "Repeated root"});
        } else {
            double sqrtD = std::sqrt(-discriminant);
            double realPart = -b / (2 * a);
            double imagPart = sqrtD / (2 * a);
            res.roots.push_back({realPart, imagPart});
            res.roots.push_back({realPart, -imagPart});
            res.steps.push_back({"Δ < 0: Two complex conjugate roots", ""});
            std::ostringstream r;
            r << "x = " << Polynomial::formatNum(realPart) << " ± " << Polynomial::formatNum(imagPart) << "i";
            res.steps.push_back({r.str(), "Complex roots (conjugate pair)"});
        }

        return res;
    }

    static RootResult newtonRaphson(const Polynomial& p, double x0, int maxIter = 50) {
        RootResult res;
        Polynomial dp(Calculus_differentiate_stub(p));

        res.steps.push_back({"Newton-Raphson: xₙ₊₁ = xₙ - f(xₙ)/f'(xₙ)", "Iterative root finding"});
        res.steps.push_back({"f(x) = " + p.toString(), ""});
        res.steps.push_back({"f'(x) = Derivative of f(x)", ""});
        res.steps.push_back({"Initial guess: x₀ = " + Polynomial::formatNum(x0), ""});

        double x = x0;
        double tol = 1e-10;

        for (int i = 0; i < maxIter; i++) {
            double fx = p.evaluate(x);
            double dpx = dp.evaluate(x);
            res.newtonTable.push_back({x, fx});

            if (std::abs(dpx) < 1e-15) {
                res.error = "Derivative is zero at iteration " + std::to_string(i);
                break;
            }

            double xNext = x - fx / dpx;
            std::ostringstream step;
            step << "Iter " << (i+1) << ": x = " << Polynomial::formatNum(x)
                 << ", f(x) = " << Polynomial::formatNum(fx)
                 << ", f'(x) = " << Polynomial::formatNum(dpx)
                 << " → x_new = " << Polynomial::formatNum(xNext);
            res.steps.push_back({step.str(), ""});

            if (std::abs(xNext - x) < tol) {
                x = xNext;
                res.newtonTable.push_back({x, p.evaluate(x)});
                break;
            }
            x = xNext;
        }

        res.roots.push_back({x, 0.0});
        res.steps.push_back({"Root ≈ " + Polynomial::formatNum(x), "Converged"});
        return res;
    }

private:
    static Polynomial Calculus_differentiate_stub(const Polynomial& p) {
        int deg = p.degree();
        if (deg == 0) return Polynomial({0.0});
        std::vector<double> dc(deg, 0.0);
        for (int i = 1; i <= deg; i++) dc[i-1] = i * p.coeffs[i];
        Polynomial d(dc);
        d.trim();
        return d;
    }

    static RootResult solveCubicNewton(const Polynomial& p) {
        RootResult res = newtonRaphson(p, 0.0);
        res.steps.insert(res.steps.begin(), {p.toString() + " = 0", "Cubic polynomial — using Newton-Raphson"});
        return res;
    }

    static RootResult solveHighOrderNewton(const Polynomial& p) {
        RootResult res = newtonRaphson(p, 1.0);
        res.steps.insert(res.steps.begin(), {p.toString() + " = 0",
            "Degree " + std::to_string(p.degree()) + " polynomial — using Newton-Raphson from x=1"});
        return res;
    }
};
