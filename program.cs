using System;

class LCSLengthCalculator
{
    static int[,] memo;

    static void Main()
    {
        Console.Write("Enter the first string: ");
        string str1 = Console.ReadLine();

        Console.Write("Enter the second string: ");
        string str2 = Console.ReadLine();

        int length = CalculateLCSLength(str1, str2);

        Console.WriteLine("Length of the Longest Common Subsequence: " + length);
    }

    static int CalculateLCSLength(string str1, string str2)
    {
        int m = str1.Length;
        int n = str2.Length;

        memo = new int[m + 1, n + 1];

        for (int i = 0; i <= m; i++)
        {
            for (int j = 0; j <= n; j++)
            {
                if (i == 0 || j == 0)
                {
                    memo[i, j] = 0;
                }
                else if (str1[i - 1] == str2[j - 1])
                {
                    memo[i, j] = 1 + memo[i - 1, j - 1];
                }
                else
                {
                    memo[i, j] = Math.Max(memo[i - 1, j], memo[i, j - 1]);
                }
            }
        }

        return memo[m, n];
    }
}
